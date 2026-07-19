// @vitest-environment node
//
// Integration test for the properties repository — runs against the LOCAL
// Supabase stack. Real CRUD + RLS tenancy isolation across two agencies
// (P-01…P-03 + "agency-scoped" guarantee).
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { serviceClient, anonClient } from "@/test/localSupabase";
import {
  insertProperty,
  selectProperties,
  selectPropertyById,
  updatePropertyById,
} from "../repository";

describe("properties repository (integration · local Supabase)", () => {
  const admin = serviceClient();
  const suffix = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
  const cleanup: { agencyId: string; userId: string }[] = [];

  let clientA!: SupabaseClient;
  let clientB!: SupabaseClient;
  let agencyAId = "";
  let agencyBId = "";
  let propId = "";

  async function signUp(who: string, agencyName: string) {
    const email = `properties_${suffix}_${who}@example.com`;
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

  it("creates a property scoped to the agency, defaulting state to NSW (P-01)", async () => {
    const p = await insertProperty(clientA, agencyAId, {
      address: "1 King St",
      suburb: "Newtown",
      propertyType: "house",
      bedrooms: 3,
      bathrooms: 2,
      landSizeSqm: 450,
    });
    propId = p.id;
    expect(p.address).toBe("1 King St");
    expect(p.agencyId).toBe(agencyAId);
    expect(p.propertyType).toBe("house");
    expect(p.state).toBe("NSW");
    expect(p.bedrooms).toBe(3);
    expect(p.landSizeSqm).toBe(450);
  });

  it("lists only the agency's own properties (P-02 · RLS isolation)", async () => {
    await insertProperty(clientB, agencyBId, { address: "99 Other Rd" });

    const aAddrs = (await selectProperties(clientA)).map((p) => p.address);
    expect(aAddrs).toContain("1 King St");
    expect(aAddrs).not.toContain("99 Other Rd");

    const bAddrs = (await selectProperties(clientB)).map((p) => p.address);
    expect(bAddrs).not.toContain("1 King St");
  });

  it("reads by id within the agency, hidden from others (P-03 · RLS)", async () => {
    expect((await selectPropertyById(clientA, propId))?.address).toBe(
      "1 King St",
    );
    expect(await selectPropertyById(clientB, propId)).toBeNull();
  });

  it("updates and persists (P-03)", async () => {
    const updated = await updatePropertyById(clientA, propId, {
      bedrooms: 4,
      zoning: "R3",
    });
    expect(updated.bedrooms).toBe(4);
    expect(updated.zoning).toBe("R3");
    expect((await selectPropertyById(clientA, propId))?.bedrooms).toBe(4);
  });

  it("cannot create a property for another agency (RLS WITH CHECK)", async () => {
    await expect(
      insertProperty(clientA, agencyBId, { address: "Sneaky" }),
    ).rejects.toThrow();
  });
});
