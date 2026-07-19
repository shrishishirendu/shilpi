// @vitest-environment node
//
// Integration test for the offers repository — runs against the LOCAL Supabase
// stack. Covers O-01 (submit), O-02 (status lifecycle), and RLS isolation
// (an offer under agency A's deal is invisible/uninsertable to agency B).
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { serviceClient, anonClient } from "@/test/localSupabase";
import {
  insertOffer,
  selectOffersByDeal,
  selectOfferById,
  updateOfferStatus,
} from "../repository";

describe("offers repository (integration · local Supabase)", () => {
  const admin = serviceClient();
  const suffix = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
  const cleanup: { agencyId: string; userId: string }[] = [];

  let clientA!: SupabaseClient;
  let clientB!: SupabaseClient;
  let dealAId = "";
  let buyerId = "";

  async function signUp(who: string, agencyName: string) {
    const client = anonClient();
    const { data } = await client.auth.signUp({
      email: `offers_${suffix}_${who}@example.com`,
      password: "Password123!",
      options: { data: { full_name: who, agency_name: agencyName } },
    });
    const userId = data.user!.id;
    const { data: u } = await admin
      .from("users")
      .select("agency_id")
      .eq("id", userId)
      .single();
    const agencyId = u!.agency_id as string;
    cleanup.push({ agencyId, userId });
    return { client, agencyId, userId };
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
    const a = await signUp("A", "Agency A");
    const b = await signUp("B", "Agency B");
    clientA = a.client;
    clientB = b.client;

    const { data: deal } = await clientA
      .from("deals")
      .insert({ agency_id: a.agencyId, owner_user_id: a.userId })
      .select("id")
      .single();
    dealAId = deal!.id as string;

    const { data: contact } = await clientA
      .from("contacts")
      .insert({ agency_id: a.agencyId, full_name: "Bianca Buyer" })
      .select("id")
      .single();
    buyerId = contact!.id as string;
  });

  afterAll(async () => {
    for (const c of cleanup) {
      await admin.from("agencies").delete().eq("id", c.agencyId);
      await admin.auth.admin.deleteUser(c.userId).catch(() => {});
    }
  });

  it("submits an offer against a deal, starting 'submitted' (O-01)", async () => {
    const offer = await insertOffer(clientA, dealAId, {
      buyerContactId: buyerId,
      amount: 1_450_000,
      isConditional: true,
      conditions: "Subject to finance",
      settlementDays: 42,
    });
    expect(offer.dealId).toBe(dealAId);
    expect(offer.status).toBe("submitted");
    expect(offer.amount).toBe(1_450_000);
    expect(offer.isConditional).toBe(true);
    expect(offer.buyerContactId).toBe(buyerId);
  });

  it("moves through the status lifecycle (O-02)", async () => {
    const offer = await insertOffer(clientA, dealAId, { amount: 1_400_000 });
    const countered = await updateOfferStatus(clientA, offer.id, "countered");
    expect(countered.status).toBe("countered");
    const rejected = await updateOfferStatus(clientA, offer.id, "rejected");
    expect(rejected.status).toBe("rejected");
  });

  it("lists offers for the deal, newest first (O-04)", async () => {
    const offers = await selectOffersByDeal(clientA, dealAId);
    expect(offers.length).toBeGreaterThanOrEqual(2);
    expect(offers.every((o) => o.dealId === dealAId)).toBe(true);
  });

  it("isolates offers by agency — B cannot see or add to A's deal (RLS)", async () => {
    expect(await selectOffersByDeal(clientB, dealAId)).toHaveLength(0);

    await expect(
      insertOffer(clientB, dealAId, { amount: 999 }),
    ).rejects.toThrow();

    const anyOffer = (await selectOffersByDeal(clientA, dealAId))[0];
    expect(await selectOfferById(clientB, anyOffer.id)).toBeNull();
  });
});
