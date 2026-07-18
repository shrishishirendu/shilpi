import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCurrentAgencyId } from "../tenancy";
import { createServerSupabaseClient } from "../supabase/server";

// Replace the server client entirely — the tenancy resolver's job is the
// logic (no user -> null, error -> null, otherwise the agency_id), not the
// real network call. Mocking here also keeps next/headers out of the test.
vi.mock("../supabase/server", () => ({
  createServerSupabaseClient: vi.fn(),
}));

const mockedCreate = vi.mocked(createServerSupabaseClient);

/** Build a fake Supabase client with a chainable users query. */
function fakeClient(opts: {
  user: { id: string } | null;
  userError?: unknown;
  row?: { agency_id: string } | null;
  rowError?: unknown;
}) {
  return {
    auth: {
      getUser: async () => ({
        data: { user: opts.user },
        error: opts.userError ?? null,
      }),
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

describe("platform/tenancy — getCurrentAgencyId", () => {
  beforeEach(() => {
    mockedCreate.mockReset();
  });

  it("returns the agency_id for a logged-in user", async () => {
    mockedCreate.mockResolvedValue(
      fakeClient({ user: { id: "u1" }, row: { agency_id: "agency-A" } }),
    );
    await expect(getCurrentAgencyId()).resolves.toBe("agency-A");
  });

  it("returns null when nobody is logged in", async () => {
    mockedCreate.mockResolvedValue(fakeClient({ user: null }));
    await expect(getCurrentAgencyId()).resolves.toBeNull();
  });

  it("returns null when the users lookup errors", async () => {
    mockedCreate.mockResolvedValue(
      fakeClient({
        user: { id: "u1" },
        row: null,
        rowError: { message: "no row" },
      }),
    );
    await expect(getCurrentAgencyId()).resolves.toBeNull();
  });
});
