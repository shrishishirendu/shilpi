// @vitest-environment node
//
// Integration test for A-01 — runs against the LOCAL Supabase stack
// (`npm run db:start`). Exercises the real 002 trigger + RLS, not mocks.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { serviceClient, anonClient } from "@/test/localSupabase";

const admin = serviceClient();
const createdUserIds: string[] = [];
const createdAgencyIds: string[] = [];

async function signUpNew(agencyName: string, fullName: string) {
  const email = `a01_${Date.now()}_${Math.floor(Math.random() * 1e9)}@example.com`;
  const client = anonClient();
  const { data, error } = await client.auth.signUp({
    email,
    password: "Password123!",
    options: { data: { full_name: fullName, agency_name: agencyName } },
  });
  return { data, error, email, client };
}

describe("A-01 signup provisioning (integration · local Supabase)", () => {
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
  });

  afterAll(async () => {
    // Deleting the agency cascades to its users row; then remove the auth user.
    for (const id of createdAgencyIds) {
      await admin.from("agencies").delete().eq("id", id);
    }
    for (const id of createdUserIds) {
      await admin.auth.admin.deleteUser(id).catch(() => {});
    }
  });

  it("creates one agency + one principal user, id mirroring the auth user", async () => {
    const { data, error } = await signUpNew("Harbour Realty", "Ada Vendor");
    expect(error).toBeNull();

    const userId = data.user!.id;
    createdUserIds.push(userId);

    const { data: userRow, error: uErr } = await admin
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    expect(uErr).toBeNull();
    expect(userRow).toMatchObject({
      id: userId,
      role: "principal",
      full_name: "Ada Vendor",
    });
    createdAgencyIds.push(userRow!.agency_id);

    const { data: agency } = await admin
      .from("agencies")
      .select("*")
      .eq("id", userRow!.agency_id)
      .single();
    expect(agency!.name).toBe("Harbour Realty");

    // Exactly one users row for this auth id — no duplicate provisioning.
    const { count } = await admin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("id", userId);
    expect(count).toBe(1);
  });

  it("isolates agencies via RLS — a signed-in user sees only their own data", async () => {
    const a = await signUpNew("Agency A", "Alice");
    const b = await signUpNew("Agency B", "Bob");
    expect(a.error).toBeNull();
    expect(b.error).toBeNull();
    createdUserIds.push(a.data.user!.id, b.data.user!.id);

    const { data: aUser } = await admin
      .from("users")
      .select("agency_id")
      .eq("id", a.data.user!.id)
      .single();
    const { data: bUser } = await admin
      .from("users")
      .select("agency_id")
      .eq("id", b.data.user!.id)
      .single();
    createdAgencyIds.push(aUser!.agency_id, bUser!.agency_id);

    // As A (authenticated via the signUp session), agencies returns only A's.
    const { data: aVisible, error: aErr } = await a.client
      .from("agencies")
      .select("id");
    expect(aErr).toBeNull();
    expect(aVisible!.map((r) => r.id)).toEqual([aUser!.agency_id]);
    expect(aVisible!.map((r) => r.id)).not.toContain(bUser!.agency_id);

    // And A sees only their own users row, not B's.
    const { data: aUsers } = await a.client.from("users").select("id");
    expect(aUsers!.map((r) => r.id)).toEqual([a.data.user!.id]);
  });
});
