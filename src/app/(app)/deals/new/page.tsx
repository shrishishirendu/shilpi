import Link from "next/link";
import { listProperties } from "@/modules/properties";
import { createDealAction } from "../actions";
import styles from "../deals.module.css";

export default async function NewDealPage() {
  const properties = await listProperties();

  return (
    <div className={styles.formWrap}>
      <Link href="/deals" className={styles.backLink}>
        ← Pipeline
      </Link>
      <form action={createDealAction} className={styles.form}>
        <label className={styles.field}>
          <span className={styles.label}>Property (optional)</span>
          <select className={styles.input} name="property_id" defaultValue="">
            <option value="">— No property yet —</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.address}
                {p.suburb ? `, ${p.suburb}` : ""}
              </option>
            ))}
          </select>
        </label>
        <p className={styles.hint}>
          A new deal starts at stage 1 (Enquiry &amp; qualification). You&apos;ll
          link contacts and advance stages from the deal page.
        </p>
        <button className={styles.button} type="submit">
          Create deal
        </button>
      </form>
    </div>
  );
}
