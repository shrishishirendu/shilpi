// @vitest-environment node
//
// Integration test for A-02 — runs against the LOCAL Supabase stack
// (`npm run db:start`). Signs a user up (via the 002 trigger), then exercises
// the real login / logout session lifecycle.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { serviceClient, anonClient } from "@/test/localSupabase";

describe("A-02 login/logout (integration · local Supabase)", () => {
  const admin = serviceClient();
  const email = `a02_${Date.now()}_${Math.floor(Math.random() * 1e9)}@example.com`;
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

    const { data, error: suErr } = await anonClient().auth.signUp({
      email,
      password,
      options: { data: { full_name: "Log In", agency_name: "Login Agency" } },
    });
    expect(suErr).toBeNull();
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

  it("signs in with correct credentials and exposes the session", async () => {
    const client = anonClient();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });
    expect(error).toBeNull();
    expect(data.session).toBeTruthy();

    const {
      data: { user },
    } = await client.auth.getUser();
    expect(user?.id).toBe(userId);
  });

  it("rejects a wrong password", async () => {
    const client = anonClient();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password: "wrong-password",
    });
    expect(error).toBeTruthy();
    expect(data.session).toBeNull();
  });

  it("signs out and clears the session", async () => {
    const client = anonClient();
    await client.auth.signInWithPassword({ email, password });
    expect((await client.auth.getUser()).data.user?.id).toBe(userId);

    await client.auth.signOut();
    expect((await client.auth.getUser()).data.user).toBeNull();
  });
});
