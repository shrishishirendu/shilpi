import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  submitOfferAction,
  acceptOfferAction,
  rejectOfferAction,
} from "../offer-actions";
import {
  submitOffer,
  acceptOffer,
  rejectOffer,
  validateOffer,
} from "@/modules/offers";
import { redirect } from "next/navigation";

vi.mock("@/modules/offers", () => ({
  submitOffer: vi.fn(),
  acceptOffer: vi.fn(),
  counterOffer: vi.fn(),
  rejectOffer: vi.fn(),
  withdrawOffer: vi.fn(),
  validateOffer: vi.fn(() => null),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const mockedSubmit = vi.mocked(submitOffer);
const mockedAccept = vi.mocked(acceptOffer);
const mockedReject = vi.mocked(rejectOffer);
const mockedValidate = vi.mocked(validateOffer);
const mockedRedirect = vi.mocked(redirect);

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedValidate.mockReturnValue(null);
});

describe("submitOfferAction", () => {
  it("submits with parsed fields (numbers, checkbox, blanks→null) and redirects", async () => {
    await submitOfferAction(
      "d1",
      form({
        buyer_contact_id: "c1",
        amount: "1450000",
        is_conditional: "on",
        conditions: "Subject to finance",
        settlement_days: "42",
      }),
    );
    expect(mockedSubmit).toHaveBeenCalledWith("d1", {
      buyerContactId: "c1",
      amount: 1450000,
      isConditional: true,
      conditions: "Subject to finance",
      settlementDays: 42,
    });
    expect(mockedRedirect).toHaveBeenCalledWith("/deals/d1");
  });

  it("does nothing when the amount is invalid", async () => {
    mockedValidate.mockReturnValue("Enter an offer amount.");
    await submitOfferAction("d1", form({ amount: "" }));
    expect(mockedSubmit).not.toHaveBeenCalled();
    expect(mockedRedirect).not.toHaveBeenCalled();
  });
});

describe("offer status actions", () => {
  it("accept calls acceptOffer and redirects to the deal", async () => {
    await acceptOfferAction("d1", "o1");
    expect(mockedAccept).toHaveBeenCalledWith("o1");
    expect(mockedRedirect).toHaveBeenCalledWith("/deals/d1");
  });

  it("reject calls rejectOffer and redirects to the deal", async () => {
    await rejectOfferAction("d1", "o1");
    expect(mockedReject).toHaveBeenCalledWith("o1");
    expect(mockedRedirect).toHaveBeenCalledWith("/deals/d1");
  });
});
