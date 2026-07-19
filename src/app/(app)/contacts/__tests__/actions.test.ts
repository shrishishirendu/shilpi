import { describe, it, expect, vi, beforeEach } from "vitest";
import { createContactAction, updateContactAction } from "../actions";
import {
  createContact,
  updateContact,
  validateContact,
  type Contact,
} from "@/modules/contacts";
import { redirect } from "next/navigation";

vi.mock("@/modules/contacts", () => ({
  createContact: vi.fn(),
  updateContact: vi.fn(),
  validateContact: vi.fn(() => null),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const mockedCreate = vi.mocked(createContact);
const mockedUpdate = vi.mocked(updateContact);
const mockedValidate = vi.mocked(validateContact);
const mockedRedirect = vi.mocked(redirect);

const fakeContact: Contact = {
  id: "c1",
  agencyId: "a1",
  fullName: "Ada",
  email: null,
  phone: null,
  address: null,
  notes: null,
  identityVerified: false,
  createdAt: "",
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

describe("createContactAction", () => {
  it("returns the validation error and does not create", async () => {
    mockedValidate.mockReturnValue("Name is required.");
    const res = await createContactAction({ error: null }, form({ full_name: "" }));
    expect(res.error).toBe("Name is required.");
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("creates with trimmed fields (blanks → null) and redirects to the new contact", async () => {
    mockedCreate.mockResolvedValue(fakeContact);
    await createContactAction(
      { error: null },
      form({
        full_name: "  Ada  ",
        email: " ada@example.com ",
        phone: "",
        address: "",
        notes: "",
      }),
    );
    expect(mockedCreate).toHaveBeenCalledWith({
      fullName: "Ada",
      email: "ada@example.com",
      phone: null,
      address: null,
      notes: null,
    });
    expect(mockedRedirect).toHaveBeenCalledWith("/contacts/c1");
  });
});

describe("updateContactAction", () => {
  it("updates the bound id and redirects back to the contact", async () => {
    mockedUpdate.mockResolvedValue(fakeContact);
    await updateContactAction(
      "c1",
      { error: null },
      form({
        full_name: "Ada V",
        email: "",
        phone: "0400",
        address: "",
        notes: "note",
      }),
    );
    expect(mockedUpdate).toHaveBeenCalledWith("c1", {
      fullName: "Ada V",
      email: null,
      phone: "0400",
      address: null,
      notes: "note",
    });
    expect(mockedRedirect).toHaveBeenCalledWith("/contacts/c1");
  });
});
