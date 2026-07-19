import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPropertyAction, updatePropertyAction } from "../actions";
import {
  createProperty,
  updateProperty,
  validateProperty,
  type Property,
} from "@/modules/properties";
import { redirect } from "next/navigation";

vi.mock("@/modules/properties", () => ({
  createProperty: vi.fn(),
  updateProperty: vi.fn(),
  validateProperty: vi.fn(() => null),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const mockedCreate = vi.mocked(createProperty);
const mockedUpdate = vi.mocked(updateProperty);
const mockedValidate = vi.mocked(validateProperty);
const mockedRedirect = vi.mocked(redirect);

const fakeProperty: Property = {
  id: "p1",
  agencyId: "a1",
  address: "1 King St",
  suburb: null,
  postcode: null,
  state: "NSW",
  propertyType: null,
  bedrooms: null,
  bathrooms: null,
  parking: null,
  landSizeSqm: null,
  zoning: null,
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

describe("createPropertyAction", () => {
  it("returns the validation error and does not create", async () => {
    mockedValidate.mockReturnValue("Address is required.");
    const res = await createPropertyAction({ error: null }, form({ address: "" }));
    expect(res.error).toBe("Address is required.");
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("parses numbers (blank → null), trims, and redirects to the new property", async () => {
    mockedCreate.mockResolvedValue(fakeProperty);
    await createPropertyAction(
      { error: null },
      form({
        address: "  1 King St ",
        suburb: "Newtown",
        postcode: "2042",
        state: "NSW",
        property_type: "house",
        bedrooms: "3",
        bathrooms: "2",
        parking: "",
        land_size_sqm: "450.5",
        zoning: "R2",
      }),
    );
    expect(mockedCreate).toHaveBeenCalledWith({
      address: "1 King St",
      suburb: "Newtown",
      postcode: "2042",
      state: "NSW",
      propertyType: "house",
      bedrooms: 3,
      bathrooms: 2,
      parking: null,
      landSizeSqm: 450.5,
      zoning: "R2",
    });
    expect(mockedRedirect).toHaveBeenCalledWith("/properties/p1");
  });
});

describe("updatePropertyAction", () => {
  it("updates the bound id and redirects back to the property", async () => {
    mockedUpdate.mockResolvedValue(fakeProperty);
    await updatePropertyAction(
      "p1",
      { error: null },
      form({
        address: "2 Queen St",
        suburb: "",
        postcode: "",
        state: "NSW",
        property_type: "",
        bedrooms: "",
        bathrooms: "",
        parking: "",
        land_size_sqm: "",
        zoning: "",
      }),
    );
    expect(mockedUpdate).toHaveBeenCalledWith("p1", {
      address: "2 Queen St",
      suburb: null,
      postcode: null,
      state: "NSW",
      propertyType: null,
      bedrooms: null,
      bathrooms: null,
      parking: null,
      landSizeSqm: null,
      zoning: null,
    });
    expect(mockedRedirect).toHaveBeenCalledWith("/properties/p1");
  });
});
