import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCurrentProfile } from "../profile";
import { createServerSupabaseClient } from "../supabase/server";

vi.mock("../supabase/server", () => ({
  createServerSupabaseClient: vi.fn(),
}));

const mockedCreate = vi.mocked(createServerSupabaseClient);

function fakeClient(opts: {
  user: { id: string; email?: string } | null;
  row?: unknown;
  rowError?: unknown;
}) {
  return {
    auth: {
      getUser: async () => ({ data: { user: opts.user }, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: opts.row ?? null,
            error: opts.rowError ?? null,
          }),
        }),
      }),
    }),
  } as unknown as Awaited<ReturnType<typeof createServerSupabaseClient>>;
}

describe("platform/profile — getCurrentProfile", () => {
  beforeEach(() => mockedCreate.mockReset());

  it("returns the profile with the embedded agency name", async () => {
    mockedCreate.mockResolvedValue(
      fakeClient({
        user: { id: "u1", email: "a@b.com" },
        row: {
          full_name: "Ada",
          role: "principal",
          agency_id: "ag1",
          agencies: { name: "Harbour Realty" },
        },
      }),
    );
    await expect(getCurrentProfile()).resolves.toEqual({
      userId: "u1",
      email: "a@b.com",
      fullName: "Ada",
      role: "principal",
      agencyId: "ag1",
      agencyName: "Harbour Realty",
    });
  });

  it("handles the agency embedded as an array", async () => {
    mockedCreate.mockResolvedValue(
      fakeClient({
        user: { id: "u1", email: "a@b.com" },
        row: {
          full_name: "Ada",
          role: "principal",
          agency_id: "ag1",
          agencies: [{ name: "Harbour Realty" }],
        },
      }),
    );
    expect((await getCurrentProfile())?.agencyName).toBe("Harbour Realty");
  });

  it("returns null when nobody is logged in", async () => {
    mockedCreate.mockResolvedValue(fakeClient({ user: null }));
    await expect(getCurrentProfile()).resolves.toBeNull();
  });

  it("returns null when the users lookup errors", async () => {
    mockedCreate.mockResolvedValue(
      fakeClient({
        user: { id: "u1" },
        row: null,
        rowError: { message: "no row" },
      }),
    );
    await expect(getCurrentProfile()).resolves.toBeNull();
  });
});
