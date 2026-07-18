import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getSupabaseEnv, isSupabaseConfigured } from "../env";

const URL_KEY = "NEXT_PUBLIC_SUPABASE_URL";
const KEY_KEY = "NEXT_PUBLIC_SUPABASE_ANON_KEY";

describe("platform/env", () => {
  const original = {
    url: process.env[URL_KEY],
    key: process.env[KEY_KEY],
  };

  beforeEach(() => {
    delete process.env[URL_KEY];
    delete process.env[KEY_KEY];
  });

  afterEach(() => {
    process.env[URL_KEY] = original.url ?? "";
    process.env[KEY_KEY] = original.key ?? "";
  });

  it("isSupabaseConfigured is false when env is missing", () => {
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("isSupabaseConfigured is true when both vars are set", () => {
    process.env[URL_KEY] = "https://example.supabase.co";
    process.env[KEY_KEY] = "anon-key";
    expect(isSupabaseConfigured()).toBe(true);
  });

  it("getSupabaseEnv throws a helpful error when unconfigured", () => {
    expect(() => getSupabaseEnv()).toThrowError(/not configured/i);
  });

  it("getSupabaseEnv returns url + anonKey when configured", () => {
    process.env[URL_KEY] = "https://example.supabase.co";
    process.env[KEY_KEY] = "anon-key";
    expect(getSupabaseEnv()).toEqual({
      url: "https://example.supabase.co",
      anonKey: "anon-key",
    });
  });
});
