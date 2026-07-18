/**
 * Supabase connection check. Uses the anon key from .env.local.
 *   npm run db:check
 *
 * What it proves: the URL + anon key are valid and the schema is present
 * (the `deal_stages` table exists). It does NOT count the 13 seeded stages —
 * RLS (policy `stages_readable`) hides reference data from anonymous requests,
 * so an anon read returns 0 rows by design. The seed count is confirmed with an
 * authenticated read during A-01, or via the SQL editor:
 *   select count(*) from deal_stages;
 *
 * Note: sets process.exitCode rather than calling process.exit(), which on
 * Windows can crash libuv while the HTTP socket is still closing.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error(
    "✗ Missing env. Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  );
  process.exitCode = 1;
} else {
  console.log(`→ Connecting to ${url} …`);

  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase
    .from("deal_stages")
    .select("stage_number")
    .limit(1);

  if (error) {
    const detail = `${error.code ?? ""} ${error.message ?? String(error)}`.trim();
    if (/api key|jwt|invalid/i.test(detail)) {
      console.error(`✗ Auth failed — the anon key looks wrong: ${detail}`);
    } else if (/find the table|schema cache|does not exist|PGRST205|relation/i.test(detail)) {
      console.error(
        `✗ Connected, but 'deal_stages' was not found — did the schema run? (${detail})`,
      );
    } else {
      console.error(`✗ Query failed: ${detail}`);
    }
    process.exitCode = 1;
  } else {
    console.log("✓ Connected. URL + anon key are valid and the schema is present.");
    console.log(
      `  Anonymous read of deal_stages returned ${data.length} row(s) — expected 0: RLS`,
    );
    console.log(
      "  restricts the stage list to authenticated users (policy: stages_readable). Correct.",
    );
    console.log("");
    console.log(
      "  Seed count (13 stages) is confirmed during A-01 with an authenticated read,",
    );
    console.log("  or now in the SQL editor:  select count(*) from deal_stages;");
  }
}
