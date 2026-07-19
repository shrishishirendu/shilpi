// @vitest-environment node
//
// Integration test for the deals spine — runs against the LOCAL Supabase stack.
// Covers D-01 (create at stage 1), D-02 (link role), D-03 (one contact, two
// roles, two deals — validates decision D2), D-04 (history on create), D-06
// (advance writes history), D-07 (history is append-only).
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { serviceClient, anonClient } from "@/test/localSupabase";
import {
  insertDeal,
  insertDealContact,
  updateDealStage,
  selectDealWithLinks,
  selectStageHistory,
} from "../repository";

describe("deals repository (integration · local Supabase)", () => {
  const admin = serviceClient();
  const suffix = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
  const cleanup: { agencyId: string; userId: string }[] = [];

  let client!: SupabaseClient;
  let agencyId = "";
  let userId = "";

  async function newContact(fullName: string): Promise<string> {
    const { data, error } = await client
      .from("contacts")
      .insert({ agency_id: agencyId, full_name: fullName })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return data!.id as string;
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
    const email = `deals_${suffix}@example.com`;
    client = anonClient();
    const { data } = await client.auth.signUp({
      email,
      password: "Password123!",
      options: { data: { full_name: "Owner", agency_name: "Deal Agency" } },
    });
    userId = data.user!.id;
    const { data: u } = await admin
      .from("users")
      .select("agency_id")
      .eq("id", userId)
      .single();
    agencyId = u!.agency_id as string;
    cleanup.push({ agencyId, userId });
  });

  afterAll(async () => {
    for (const c of cleanup) {
      await admin.from("agencies").delete().eq("id", c.agencyId);
      await admin.auth.admin.deleteUser(c.userId).catch(() => {});
    }
  });

  it("creates a deal at stage 1 (active/agent) and records initial history (D-01, D-04)", async () => {
    const deal = await insertDeal(client, agencyId, userId, {});
    expect(deal.currentStage).toBe(1);
    expect(deal.status).toBe("active");
    expect(deal.mode).toBe("agent");
    expect(deal.agencyId).toBe(agencyId);

    const history = await selectStageHistory(client, deal.id);
    expect(history).toHaveLength(1);
    expect(history[0].fromStage).toBeNull();
    expect(history[0].toStage).toBe(1);
    expect(history[0].changedBy).toBe(userId);
  });

  it("links a contact to a deal with a role (D-02)", async () => {
    const deal = await insertDeal(client, agencyId, userId, {});
    const contactId = await newContact("Vera Vendor");
    const link = await insertDealContact(client, deal.id, contactId, "vendor", true);
    expect(link.contactId).toBe(contactId);
    expect(link.role).toBe("vendor");
    expect(link.isPrimary).toBe(true);
  });

  it("lets ONE contact be vendor on one deal and buyer on another (D-03 · validates D2)", async () => {
    const samId = await newContact("Sam Both");

    const deal1 = await insertDeal(client, agencyId, userId, {});
    await insertDealContact(client, deal1.id, samId, "vendor", true);

    const deal2 = await insertDeal(client, agencyId, userId, {});
    await insertDealContact(client, deal2.id, samId, "buyer", true);

    const d1 = await selectDealWithLinks(client, deal1.id);
    const d2 = await selectDealWithLinks(client, deal2.id);

    const onDeal1 = d1!.links.find((l) => l.contactId === samId);
    const onDeal2 = d2!.links.find((l) => l.contactId === samId);

    expect(onDeal1?.role).toBe("vendor");
    expect(onDeal2?.role).toBe("buyer");
    // Same person, two roles, two deals.
    expect(onDeal1?.contactId).toBe(onDeal2?.contactId);
    expect(onDeal1?.role).not.toBe(onDeal2?.role);
  });

  it("advancing a stage writes history (D-06)", async () => {
    const deal = await insertDeal(client, agencyId, userId, {});
    const advanced = await updateDealStage(
      client,
      deal.id,
      2,
      new Date().toISOString(),
    );
    expect(advanced.currentStage).toBe(2);

    const history = await selectStageHistory(client, deal.id);
    expect(history).toHaveLength(2);
    expect(history[1].fromStage).toBe(1);
    expect(history[1].toStage).toBe(2);
  });

  it("keeps stage_history append-only and intact across back-and-forth moves (D-07)", async () => {
    const deal = await insertDeal(client, agencyId, userId, {});
    await updateDealStage(client, deal.id, 2, new Date().toISOString());
    await updateDealStage(client, deal.id, 1, new Date().toISOString());

    const history = await selectStageHistory(client, deal.id);
    // null->1, 1->2, 2->1 — all preserved.
    expect(history.map((h) => [h.fromStage, h.toStage])).toEqual([
      [null, 1],
      [1, 2],
      [2, 1],
    ]);

    // The app role cannot delete or update history (write privileges revoked).
    const { error: delErr } = await client
      .from("stage_history")
      .delete()
      .eq("deal_id", deal.id);
    expect(delErr).toBeTruthy();

    const { error: updErr } = await client
      .from("stage_history")
      .update({ note: "tampered" })
      .eq("deal_id", deal.id);
    expect(updErr).toBeTruthy();

    // History is unchanged.
    expect(await selectStageHistory(client, deal.id)).toHaveLength(3);
  });
});
