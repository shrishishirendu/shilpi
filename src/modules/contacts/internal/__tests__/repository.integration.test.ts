// @vitest-environment node
//
// Integration test for the contacts repository — runs against the LOCAL
// Supabase stack. Exercises real CRUD + RLS tenancy isolation across two
// agencies (C-01…C-04 + the "agency's contacts only" guarantee).
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { serviceClient, anonClient } from "@/test/localSupabase";
import {
  insertContact,
  selectContacts,
  searchContactsByName,
  selectContactById,
  updateContactById,
} from "../repository";

describe("contacts repository (integration · local Supabase)", () => {
  const admin = serviceClient();
  const suffix = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
  const cleanup: { agencyId: string; userId: string }[] = [];

  let clientA!: SupabaseClient;
  let clientB!: SupabaseClient;
  let agencyAId = "";
  let agencyBId = "";
  let aliceId = "";

  async function signUp(who: string, agencyName: string) {
    const email = `contacts_${suffix}_${who}@example.com`;
    const client = anonClient();
    const { data } = await client.auth.signUp({
      email,
      password: "Password123!",
      options: { data: { full_name: who, agency_name: agencyName } },
    });
    const userId = data.user!.id;
    const { data: u } = await admin
      .from("users")
      .select("agency_id")
      .eq("id", userId)
      .single();
    cleanup.push({ agencyId: u!.agency_id as string, userId });
    return { client, agencyId: u!.agency_id as string };
  }

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
    const a = await signUp("AgencyA", "Agency A");
    const b = await signUp("AgencyB", "Agency B");
    clientA = a.client;
    agencyAId = a.agencyId;
    clientB = b.client;
    agencyBId = b.agencyId;
  });

  afterAll(async () => {
    for (const c of cleanup) {
      await admin.from("agencies").delete().eq("id", c.agencyId);
      await admin.auth.admin.deleteUser(c.userId).catch(() => {});
    }
  });

  it("creates a contact scoped to the agency (C-01)", async () => {
    const contact = await insertContact(clientA, agencyAId, {
      fullName: "Alice Buyer",
      email: "alice@example.com",
      phone: "0400 000 000",
    });
    aliceId = contact.id;
    expect(contact.fullName).toBe("Alice Buyer");
    expect(contact.agencyId).toBe(agencyAId);
    expect(contact.email).toBe("alice@example.com");
  });

  it("lists only the agency's own contacts (C-02 · RLS isolation)", async () => {
    await insertContact(clientB, agencyBId, { fullName: "Bob Vendor" });

    const aNames = (await selectContacts(clientA)).map((c) => c.fullName);
    expect(aNames).toContain("Alice Buyer");
    expect(aNames).not.toContain("Bob Vendor");

    const bNames = (await selectContacts(clientB)).map((c) => c.fullName);
    expect(bNames).not.toContain("Alice Buyer");
  });

  it("searches by partial name (C-03)", async () => {
    const hits = await searchContactsByName(clientA, "ali");
    expect(hits.map((c) => c.fullName)).toContain("Alice Buyer");
    expect(await searchContactsByName(clientA, "zzz")).toHaveLength(0);
  });

  it("reads by id within the agency, hidden from others (C-04 · RLS)", async () => {
    expect((await selectContactById(clientA, aliceId))?.fullName).toBe(
      "Alice Buyer",
    );
    expect(await selectContactById(clientB, aliceId)).toBeNull();
  });

  it("updates and persists (C-04)", async () => {
    const updated = await updateContactById(clientA, aliceId, {
      fullName: "Alice Vendor",
      notes: "Now selling",
    });
    expect(updated.fullName).toBe("Alice Vendor");
    expect(updated.notes).toBe("Now selling");
    expect((await selectContactById(clientA, aliceId))?.fullName).toBe(
      "Alice Vendor",
    );
  });

  it("cannot create a contact for another agency (RLS WITH CHECK)", async () => {
    await expect(
      insertContact(clientA, agencyBId, { fullName: "Sneaky" }),
    ).rejects.toThrow();
  });
});
