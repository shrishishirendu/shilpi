import styles from "./page.module.css";

/**
 * Foundation landing page (F-03).
 * Confirms the app runs and reports whether Supabase env is wired.
 * Replaced by the real dashboard/auth flow in Slice 1.
 */
export default function Home() {
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.mark}>S</div>
          <div className={styles.name}>Shilpi</div>
        </div>
        <p className={styles.tag}>
          End-to-end Australian property transaction platform — foundation.
        </p>

        <ul className={styles.checklist}>
          <li className={styles.row}>
            <span className={`${styles.dot} ${styles.ok}`}>✓</span>
            Next.js app running (App Router + TypeScript)
          </li>
          <li className={styles.row}>
            <span
              className={`${styles.dot} ${
                supabaseConfigured ? styles.ok : styles.pending
              }`}
            >
              {supabaseConfigured ? "✓" : "…"}
            </span>
            {supabaseConfigured
              ? "Supabase environment configured"
              : "Supabase not yet configured (F-01/F-02 pending)"}
          </li>
        </ul>

        <div className={styles.foot}>Slice 0 — Foundation</div>
      </div>
    </main>
  );
}
