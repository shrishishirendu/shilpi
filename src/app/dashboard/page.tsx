import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentAgencyId } from "@/platform";

/**
 * Minimal placeholder so signup has somewhere to land. The real empty
 * dashboard shell is story A-04 — this is intentionally bare.
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signup");

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
      <p style={{ marginTop: 16, fontSize: 12, color: "var(--g400)" }}>
        Dashboard shell coming next (A-04).
      </p>
    </main>
  );
}
