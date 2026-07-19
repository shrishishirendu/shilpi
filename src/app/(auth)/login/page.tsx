"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type LoginState } from "./actions";
import styles from "../auth.module.css";

const initialState: LoginState = { error: null };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.mark}>S</div>
          <span className={styles.name}>Shilpi</span>
        </div>
        <h1 className={styles.title}>Log in</h1>
        <p className={styles.sub}>Welcome back.</p>

        <form action={formAction} className={styles.form}>
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
              autoComplete="current-password"
              required
            />
          </label>

          {state.error && (
            <p className={styles.error} role="alert">
              {state.error}
            </p>
          )}

          <button className={styles.button} type="submit" disabled={isPending}>
            {isPending ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className={styles.foot}>
          Need an account? <Link href="/signup">Create your agency</Link>
        </p>
      </div>
    </div>
  );
}
