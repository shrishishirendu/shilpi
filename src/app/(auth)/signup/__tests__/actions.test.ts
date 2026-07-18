import { describe, it, expect, vi, beforeEach } from "vitest";
import { signUpWithAgency } from "../actions";
import { createServerSupabaseClient } from "@/platform";
import { redirect } from "next/navigation";

vi.mock("@/platform", () => ({ createServerSupabaseClient: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const mockedCreate = vi.mocked(createServerSupabaseClient);
const mockedRedirect = vi.mocked(redirect);

const validFields = {
  full_name: "Ada Vendor",
  agency_name: "Harbour Realty",
  email: "ada@example.com",
  password: "secret123",
};

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

function fakeClient(signUpResult: unknown) {
  const signUp = vi.fn(async () => signUpResult);
  return { client: { auth: { signUp } }, signUp };
}

describe("signUpWithAgency", () => {
  beforeEach(() => {
    mockedCreate.mockReset();
    mockedRedirect.mockReset();
  });

  it("returns a validation error and never calls Supabase for bad input", async () => {
    const res = await signUpWithAgency(
      { error: null },
      form({ ...validFields, email: "bad" }),
    );
    expect(res.error).toMatch(/valid email/i);
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("passes full_name + agency_name through as signup metadata", async () => {
    const { client, signUp } = fakeClient({
      data: { session: { access_token: "t" }, user: { id: "u1" } },
      error: null,
    });
    mockedCreate.mockResolvedValue(client as never);

    await signUpWithAgency({ error: null }, form(validFields));

    expect(signUp).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "secret123",
      options: { data: { full_name: "Ada Vendor", agency_name: "Harbour Realty" } },
    });
  });

  it("redirects to /dashboard when a session is returned", async () => {
    const { client } = fakeClient({
      data: { session: { access_token: "t" }, user: { id: "u1" } },
      error: null,
    });
    mockedCreate.mockResolvedValue(client as never);

    await signUpWithAgency({ error: null }, form(validFields));
    expect(mockedRedirect).toHaveBeenCalledWith("/dashboard");
  });

  it("asks for email confirmation when no session is returned", async () => {
    const { client } = fakeClient({
      data: { session: null, user: { id: "u1" } },
      error: null,
    });
    mockedCreate.mockResolvedValue(client as never);

    const res = await signUpWithAgency({ error: null }, form(validFields));
    expect(res).toEqual({ error: null, awaitingConfirmation: true });
    expect(mockedRedirect).not.toHaveBeenCalled();
  });

  it("surfaces a Supabase error", async () => {
    const { client } = fakeClient({
      data: { session: null, user: null },
      error: { message: "User already registered" },
    });
    mockedCreate.mockResolvedValue(client as never);

    const res = await signUpWithAgency({ error: null }, form(validFields));
    expect(res.error).toBe("User already registered");
  });
});
