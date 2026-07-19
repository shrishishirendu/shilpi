import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/platform";
import { Sidebar } from "./_components/Sidebar";
import { TopbarTitle } from "./_components/TopbarTitle";
import styles from "./app-shell.module.css";

/**
 * Authenticated app shell (sidebar + topbar + content). This layout is the auth
 * gate for every page under (app): no session → back to /login.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <div className={styles.shell}>
      <Sidebar
        userName={profile.fullName || profile.email}
        role={profile.role}
        agencyName={profile.agencyName}
      />
      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarTitle}>
            <TopbarTitle />
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
