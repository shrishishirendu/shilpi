"use client";

import { useActionState } from "react";
import type { Property } from "@/modules/properties";
import styles from "../properties.module.css";

interface FormState {
  error: string | null;
}

const initialState: FormState = { error: null };

const numStr = (v: number | null | undefined) => (v == null ? "" : String(v));

export function PropertyForm({
  action,
  defaults,
  submitLabel,
  propertyTypes,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults?: Property | null;
  submitLabel: string;
  propertyTypes: readonly string[];
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className={styles.form}>
      <label className={styles.field}>
        <span className={styles.label}>Address</span>
        <input
          className={styles.input}
          name="address"
          defaultValue={defaults?.address ?? ""}
          required
        />
      </label>

      <div className={styles.row2}>
        <label className={styles.field}>
          <span className={styles.label}>Suburb</span>
          <input
            className={styles.input}
            name="suburb"
            defaultValue={defaults?.suburb ?? ""}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Postcode</span>
          <input
            className={styles.input}
            name="postcode"
            defaultValue={defaults?.postcode ?? ""}
          />
        </label>
      </div>

      <div className={styles.row2}>
        <label className={styles.field}>
          <span className={styles.label}>State</span>
          <input
            className={styles.input}
            name="state"
            defaultValue={defaults?.state ?? "NSW"}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Property type</span>
          <select
            className={styles.input}
            name="property_type"
            defaultValue={defaults?.propertyType ?? ""}
          >
            <option value="">—</option>
            {propertyTypes.map((t) => (
              <option key={t} value={t}>
                {t[0].toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.row3}>
        <label className={styles.field}>
          <span className={styles.label}>Bedrooms</span>
          <input
            className={styles.input}
            name="bedrooms"
            type="number"
            min={0}
            step={1}
            defaultValue={numStr(defaults?.bedrooms)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Bathrooms</span>
          <input
            className={styles.input}
            name="bathrooms"
            type="number"
            min={0}
            step={1}
            defaultValue={numStr(defaults?.bathrooms)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Parking</span>
          <input
            className={styles.input}
            name="parking"
            type="number"
            min={0}
            step={1}
            defaultValue={numStr(defaults?.parking)}
          />
        </label>
      </div>

      <div className={styles.row2}>
        <label className={styles.field}>
          <span className={styles.label}>Land size (m²)</span>
          <input
            className={styles.input}
            name="land_size_sqm"
            type="number"
            min={0}
            step="any"
            defaultValue={numStr(defaults?.landSizeSqm)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Zoning</span>
          <input
            className={styles.input}
            name="zoning"
            placeholder="R2, R3…"
            defaultValue={defaults?.zoning ?? ""}
          />
        </label>
      </div>

      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}

      <button className={styles.button} type="submit" disabled={isPending}>
        {isPending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
