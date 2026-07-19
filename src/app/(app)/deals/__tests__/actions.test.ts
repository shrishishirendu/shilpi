import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createDealAction,
  addContactAction,
  advanceStageAction,
} from "../actions";
import {
  createDeal,
  linkContactToDeal,
  advanceDealStage,
  validateDealContact,
  type Deal,
} from "@/modules/deals";
import { redirect } from "next/navigation";

vi.mock("@/modules/deals", () => ({
  createDeal: vi.fn(),
  linkContactToDeal: vi.fn(),
  advanceDealStage: vi.fn(),
  validateDealContact: vi.fn(() => null),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const mockedCreate = vi.mocked(createDeal);
const mockedLink = vi.mocked(linkContactToDeal);
const mockedAdvance = vi.mocked(advanceDealStage);
const mockedValidate = vi.mocked(validateDealContact);
const mockedRedirect = vi.mocked(redirect);

const fakeDeal: Deal = {
  id: "d1",
  agencyId: "a1",
  propertyId: null,
  ownerUserId: "u1",
  currentStage: 1,
  status: "active",
  listingPrice: null,
  salePrice: null,
  saleMethod: null,
  mode: "agent",
  createdAt: "",
  updatedAt: "",
};

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedValidate.mockReturnValue(null);
});

describe("createDealAction", () => {
  it("creates with the chosen property and redirects to the deal", async () => {
    mockedCreate.mockResolvedValue(fakeDeal);
    await createDealAction(form({ property_id: "p1" }));
    expect(mockedCreate).toHaveBeenCalledWith({ propertyId: "p1" });
    expect(mockedRedirect).toHaveBeenCalledWith("/deals/d1");
  });

  it("treats a blank property as null", async () => {
    mockedCreate.mockResolvedValue(fakeDeal);
    await createDealAction(form({ property_id: "" }));
    expect(mockedCreate).toHaveBeenCalledWith({ propertyId: null });
  });
});

describe("addContactAction", () => {
  it("links the contact with the role and redirects", async () => {
    await addContactAction(
      "d1",
      form({ contact_id: "c1", role: "vendor", is_primary: "on" }),
    );
    expect(mockedLink).toHaveBeenCalledWith("d1", "c1", "vendor", true);
    expect(mockedRedirect).toHaveBeenCalledWith("/deals/d1");
  });

  it("does nothing when no contact is chosen", async () => {
    await addContactAction("d1", form({ contact_id: "", role: "vendor" }));
    expect(mockedLink).not.toHaveBeenCalled();
    expect(mockedRedirect).not.toHaveBeenCalled();
  });

  it("does nothing when the role is invalid", async () => {
    mockedValidate.mockReturnValue("Choose a valid role.");
    await addContactAction("d1", form({ contact_id: "c1", role: "bogus" }));
    expect(mockedLink).not.toHaveBeenCalled();
    expect(mockedRedirect).not.toHaveBeenCalled();
  });
});

describe("advanceStageAction", () => {
  it("advances the deal and redirects back to it", async () => {
    mockedAdvance.mockResolvedValue(fakeDeal);
    await advanceStageAction("d1");
    expect(mockedAdvance).toHaveBeenCalledWith("d1");
    expect(mockedRedirect).toHaveBeenCalledWith("/deals/d1");
  });
});
