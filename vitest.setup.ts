import "@testing-library/jest-dom/vitest";
import { existsSync, readFileSync } from "node:fs";

// Load .env.test (local Supabase test keys) into process.env so integration
// tests can reach the local stack. Existing env vars win, so CI/shell overrides
// are respected. Minimal parser — avoids pulling in dotenv.
if (existsSync(".env.test")) {
  for (const raw of readFileSync(".env.test", "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}
