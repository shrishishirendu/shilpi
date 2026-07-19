import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock everything the offers barrel imports so we can unit-test acceptOffer's
// orchestration (the cross-module call into deals) in isolation.
vi.mock("@/platform", () => ({
  createServerSupabaseClient: vi.fn(async () => ({})),
}));
vi.mock("@/modules/contacts", () => ({ getContactsByIds: vi.fn(async () => []) }));
vi.mock("@/modules/deals", () => ({ advanceDealStage: vi.fn(async () => ({})) }));
vi.mock("../internal/repository", () => ({
  insertOffer: vi.fn(),
  selectOffersByDeal: vi.fn(),
  selectOfferById: vi.fn(),
  updateOfferStatus: vi.fn(async () => ({})),
}));

import { acceptOffer } from "../index";
import { advanceDealStage } from "@/modules/deals";
import { selectOfferById, updateOfferStatus } from "../internal/repository";
import type { Offer, OfferStatus } from "../internal/types";

const mockedAdvance = vi.mocked(advanceDealStage);
const mockedSelect = vi.mocked(selectOfferById);
const mockedUpdate = vi.mocked(updateOfferStatus);

function offer(status: OfferStatus): Offer {
  return {
    id: "o1",
    dealId: "d1",
    buyerContactId: null,
    amount: 1000,
    status,
    isConditional: false,
    conditions: null,
    settlementDays: null,
    createdAt: "",
  };
}

beforeEach(() => vi.clearAllMocks());

describe("acceptOffer (O-05 · cross-module call)", () => {
  it("advances the deal stage, then marks the offer accepted", async () => {
    mockedSelect.mockResolvedValue(offer("submitted"));
    await acceptOffer("o1");
    expect(mockedAdvance).toHaveBeenCalledWith("d1");
    expect(mockedUpdate).toHaveBeenCalledWith(
      expect.anything(),
      "o1",
      "accepted",
    );
  });

  it("does nothing for an already-terminal offer", async () => {
    mockedSelect.mockResolvedValue(offer("accepted"));
    await acceptOffer("o1");
    expect(mockedAdvance).not.toHaveBeenCalled();
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("throws when the offer is missing", async () => {
    mockedSelect.mockResolvedValue(null);
    await expect(acceptOffer("o1")).rejects.toThrow(/not found/i);
  });
});
