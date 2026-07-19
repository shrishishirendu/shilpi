// @vitest-environment node
//
// Integration test for the A-04 profile query — runs against the LOCAL Supabase
// stack. Verifies that an authenticated user can read their own `users` row with
// the embedded `agencies.name` (the FK embed + RLS), which is what
// `getCurrentProfile` relies on.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { serviceClient, anonClient } from "@/test/localSupabase";

describe("A-04 profile query (integration · local Supabase)", () => {
  const admin = serviceClient();
  const email = `a04_${Date.now()}_${Math.floor(Math.random() * 1e9)}@example.com`;
  const password = "Password123!";
  let userId = "";
  let agencyId = "";

  beforeAll(async () => {
    const { error } = await admin
      .from("deal_stages")
      .select("stage_number")
      .limit(1);
    if (error) {
      throw new Error(
        `Local Supabase not reachable — run \`npm run db:start\`. (${error.message})`,
      );
    }
    const { data } = await anonClient().auth.signUp({
      email,
      password,
      options: { data: { full_name: "Ada Vendor", agency_name: "Harbour Realty" } },
    });
    userId = data.user!.id;
    const { data: u } = await admin
      .from("users")
      .select("agency_id")
      .eq("id", userId)
      .single();
    agencyId = u!.agency_id;
  });

  afterAll(async () => {
    if (agencyId) await admin.from("agencies").delete().eq("id", agencyId);
    if (userId) await admin.auth.admin.deleteUser(userId).catch(() => {});
  });

  it("an authenticated user reads their profile joined to the agency name", async () => {
    const client = anonClient();
    await client.auth.signInWithPassword({ email, password });

    const { data, error } = await client
      .from("users")
      .select("full_name, role, agency_id, agencies(name)")
      .eq("id", userId)
      .single();

    expect(error).toBeNull();
    expect(data?.role).toBe("principal");
    expect(data?.full_name).toBe("Ada Vendor");

    const agencies = data?.agencies as { name: string } | { name: string }[];
    const name = Array.isArray(agencies) ? agencies[0]?.name : agencies?.name;
    expect(name).toBe("Harbour Realty");
  });
});
