import Link from "next/link";
import { countContacts } from "@/modules/contacts";
import { countProperties } from "@/modules/properties";
import { getDealStats } from "@/modules/deals";
import styles from "./dashboard.module.css";

export default async function DashboardPage() {
  const [dealStats, contacts, properties] = await Promise.all([
    getDealStats(),
    countContacts(),
    countProperties(),
  ]);

  const stats = [
    { label: "Active deals", value: String(dealStats.activeDeals), sub: "in the pipeline" },
    {
      label: "Pipeline value",
      value: `$${dealStats.pipelineValue.toLocaleString()}`,
      sub: "listed",
    },
    { label: "Contacts", value: String(contacts), sub: "people" },
    { label: "Properties", value: String(properties), sub: "listings" },
  ];

  const hasData = dealStats.activeDeals + contacts + properties > 0;

  return (
    <div>
      <div className={styles.statGrid}>
        {stats.map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statSub}>{s.sub}</div>
          </div>
        ))}
      </div>

      {hasData ? (
        <div className={styles.jumpCard}>
          <div className={styles.jumpTitle}>Jump in</div>
          <div className={styles.jumpLinks}>
            <Link href="/deals" className={styles.jumpLink}>
              CRM pipeline →
            </Link>
            <Link href="/contacts" className={styles.jumpLink}>
              Contacts →
            </Link>
            <Link href="/properties" className={styles.jumpLink}>
              Properties →
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles.emptyCard}>
          <div className={styles.emptyIcon}>📭</div>
          <div className={styles.emptyTitle}>Your workspace is ready</div>
          <p className={styles.emptyText}>
            Nothing here yet. Add a{" "}
            <Link href="/contacts/new">contact</Link>, a{" "}
            <Link href="/properties/new">property</Link>, or a{" "}
            <Link href="/deals/new">deal</Link> and it&apos;ll show up on this
            dashboard.
          </p>
        </div>
      )}
    </div>
  );
}
