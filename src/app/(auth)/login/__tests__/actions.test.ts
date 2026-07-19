import { describe, it, expect, vi, beforeEach } from "vitest";
import { signIn } from "../actions";
import { createServerSupabaseClient } from "@/platform";
import { redirect } from "next/navigation";

vi.mock("@/platform", () => ({ createServerSupabaseClient: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const mockedCreate = vi.mocked(createServerSupabaseClient);
const mockedRedirect = vi.mocked(redirect);

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

function fakeClient(result: unknown) {
  const signInWithPassword = vi.fn(async () => result);
  return { client: { auth: { signInWithPassword } }, signInWithPassword };
}

const creds = { email: "ada@example.com", password: "secret123" };

describe("signIn", () => {
  beforeEach(() => {
    mockedCreate.mockReset();
    mockedRedirect.mockReset();
  });

  it("returns a validation error and never calls Supabase when fields are missing", async () => {
    const res = await signIn({ error: null }, form({ email: "", password: "x" }));
    expect(res.error).toMatch(/email/i);
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("calls signInWithPassword with the credentials", async () => {
    const { client, signInWithPassword } = fakeClient({ error: null });
    mockedCreate.mockResolvedValue(client as never);
    await signIn({ error: null }, form(creds));
    expect(signInWithPassword).toHaveBeenCalledWith(creds);
  });

  it("redirects to /dashboard on success", async () => {
    const { client } = fakeClient({ error: null });
    mockedCreate.mockResolvedValue(client as never);
    await signIn({ error: null }, form(creds));
    expect(mockedRedirect).toHaveBeenCalledWith("/dashboard");
  });

  it("returns a generic error (no field leak) on invalid credentials", async () => {
    const { client } = fakeClient({ error: { message: "Invalid login credentials" } });
    mockedCreate.mockResolvedValue(client as never);
    const res = await signIn({ error: null }, form(creds));
    expect(res.error).toBe("Invalid email or password.");
    expect(mockedRedirect).not.toHaveBeenCalled();
  });
});
