import styles from "./dashboard.module.css";

// A brand-new agency has no data, so these are genuinely zero. They'll be wired
// to real counts through the deals/contacts/properties module interfaces once
// those modules exist (a later Slice 1 story) — not queried directly from here.
const STATS = [
  { label: "Active deals", value: "0" },
  { label: "Pipeline value", value: "$0" },
  { label: "Contacts", value: "0" },
  { label: "Properties", value: "0" },
];

export default function DashboardPage() {
  return (
    <div>
      <div className={styles.statGrid}>
        {STATS.map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statSub}>No data yet</div>
          </div>
        ))}
      </div>

      <div className={styles.emptyCard}>
        <div className={styles.emptyIcon}>📭</div>
        <div className={styles.emptyTitle}>Your workspace is ready</div>
        <p className={styles.emptyText}>
          Nothing here yet. Your pipeline, contacts, and listings will appear on
          this dashboard as you add them — that work begins with the contacts and
          deals modules next.
        </p>
      </div>
    </div>
  );
}
