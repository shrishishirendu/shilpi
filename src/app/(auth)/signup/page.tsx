"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpWithAgency, type SignUpState } from "./actions";
import styles from "./signup.module.css";

const initialState: SignUpState = { error: null };

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState(
    signUpWithAgency,
    initialState,
  );

  if (state.awaitingConfirmation) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.brand}>
            <div className={styles.mark}>S</div>
            <span className={styles.name}>Shilpi</span>
          </div>
          <h1 className={styles.title}>Check your email</h1>
          <p className={styles.sub}>
            We&apos;ve sent a confirmation link. Confirm your address, then log
            in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.mark}>S</div>
          <span className={styles.name}>Shilpi</span>
        </div>
        <h1 className={styles.title}>Create your agency</h1>
        <p className={styles.sub}>Set up your workspace — you&apos;ll be the principal.</p>

        <form action={formAction} className={styles.form}>
          <label className={styles.field}>
            <span className={styles.label}>Your name</span>
            <input
              className={styles.input}
              name="full_name"
              type="text"
              autoComplete="name"
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Agency name</span>
            <input
              className={styles.input}
              name="agency_name"
              type="text"
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <input
              className={styles.input}
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Password</span>
            <input
              className={styles.input}
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>

          {state.error && (
            <p className={styles.error} role="alert">
              {state.error}
            </p>
          )}

          <button className={styles.button} type="submit" disabled={isPending}>
            {isPending ? "Creating…" : "Create agency"}
          </button>
        </form>

        <p className={styles.foot}>
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
