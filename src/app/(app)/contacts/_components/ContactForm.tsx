"use client";

import { useActionState } from "react";
import type { Contact } from "@/modules/contacts";
import styles from "../contacts.module.css";

interface FormState {
  error: string | null;
}

const initialState: FormState = { error: null };

export function ContactForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults?: Contact | null;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className={styles.form}>
      <label className={styles.field}>
        <span className={styles.label}>Name</span>
        <input
          className={styles.input}
          name="full_name"
          defaultValue={defaults?.fullName ?? ""}
          required
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Email</span>
        <input
          className={styles.input}
          name="email"
          type="email"
          defaultValue={defaults?.email ?? ""}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Phone</span>
        <input
          className={styles.input}
          name="phone"
          defaultValue={defaults?.phone ?? ""}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Address</span>
        <input
          className={styles.input}
          name="address"
          defaultValue={defaults?.address ?? ""}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Notes</span>
        <textarea
          className={styles.textarea}
          name="notes"
          rows={3}
          defaultValue={defaults?.notes ?? ""}
        />
      </label>

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
