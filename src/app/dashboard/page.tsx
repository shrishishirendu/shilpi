import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentAgencyId } from "@/platform";
import { signOut } from "./actions";

/**
 * Minimal placeholder so signup/login have somewhere to land. The real empty
 * dashboard shell is story A-04 — this is intentionally bare.
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const agencyId = await getCurrentAgencyId();

  return (
    <main style={{ padding: "40px", maxWidth: 560 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Welcome to Shilpi</h1>
      <p style={{ marginTop: 8, color: "var(--g600)" }}>
        Signed in as {user.email}
      </p>
      <p style={{ marginTop: 4, color: "var(--g600)" }}>
        Agency: {agencyId ?? "—"}
      </p>

      <form action={signOut} style={{ marginTop: 24 }}>
        <button
          type="submit"
          style={{
            height: 36,
            padding: "0 16px",
            border: "1px solid var(--g300)",
            borderRadius: 8,
            background: "#fff",
            color: "var(--g700)",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Log out
        </button>
      </form>

      <p style={{ marginTop: 20, fontSize: 12, color: "var(--g400)" }}>
        Dashboard shell coming next (A-04).
      </p>
    </main>
  );
}
