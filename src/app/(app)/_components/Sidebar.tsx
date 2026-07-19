"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "../actions";
import styles from "../app-shell.module.css";

interface NavLinkItem {
  label: string;
  icon: string;
  href: string;
}
interface NavSoonItem {
  label: string;
  icon: string;
  soon: true;
}
type NavEntry = NavLinkItem | NavSoonItem;

const NAV: { group: string; items: NavEntry[] }[] = [
  {
    group: "Workspace",
    items: [{ label: "Dashboard", icon: "📊", href: "/dashboard" }],
  },
  {
    group: "Agency",
    items: [
      { label: "CRM pipeline", icon: "👥", soon: true },
      { label: "Contacts", icon: "🧑", soon: true },
      { label: "Properties", icon: "🏠", soon: true },
      { label: "Compliance", icon: "🛡️", soon: true },
    ],
  },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function titleCase(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export function Sidebar({
  userName,
  role,
  agencyName,
}: {
  userName: string;
  role: string;
  agencyName: string;
}) {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoMark}>
          <div className={styles.logoK}>S</div>
          <span className={styles.logoName}>Shilpi</span>
        </div>
        <div className={styles.logoTag}>
          Australian Property Transaction Platform
        </div>
      </div>

      <nav className={styles.nav}>
        {NAV.map((section) => (
          <div key={section.group}>
            <div className={styles.navGroup}>{section.group}</div>
            {section.items.map((item) =>
              "href" in item ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`${styles.navItem} ${
                    pathname === item.href ? styles.navItemActive : ""
                  }`}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {item.label}
                </Link>
              ) : (
                <div
                  key={item.label}
                  className={`${styles.navItem} ${styles.navItemSoon}`}
                  aria-disabled="true"
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {item.label}
                  <span className={styles.soonTag}>Soon</span>
                </div>
              ),
            )}
          </div>
        ))}
      </nav>

      <div className={styles.sidebarFoot}>
        <div className={styles.userRow}>
          <div className={styles.userAv}>{initials(userName || agencyName)}</div>
          <div style={{ minWidth: 0 }}>
            <div className={styles.userName}>{userName || "—"}</div>
            <div className={styles.userRole}>
              {titleCase(role)}
              {agencyName ? ` · ${agencyName}` : ""}
            </div>
          </div>
        </div>
        <form action={signOut}>
          <button type="submit" className={styles.logoutBtn}>
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
