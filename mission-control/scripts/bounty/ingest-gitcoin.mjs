#!/usr/bin/env node
import "dotenv/config";
import fs from "fs";
import path from "path";

const API_URL = process.env.GITCOIN_API_URL || "https://gitcoin-production-api.fly.dev/api/grants";
const OUTPUT = path.join(process.cwd(), "data", "bounty", "gitcoin-opportunities.json");
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function normalize(grant) {
  return {
    platform: "gitcoin",
    slug: grant?.id?.toString() ?? "unknown",
    title: grant?.title ?? "Untitled",
    payout_low: grant?.funding_goal ?? 0,
    payout_high: grant?.funding_goal ?? 0,
    description: grant?.description ?? "",
    tags: grant?.categories ?? [],
    url: grant?.url ?? grant?.grant_url,
    last_seen_at: new Date().toISOString(),
  };
}

async function fetchGitcoin() {
  const res = await fetch(`${API_URL}?limit=50`);
  if (!res.ok) {
    throw new Error(`Gitcoin fetch failed: ${res.status}`);
  }
  const payload = await res.json();
  return payload?.data ?? [];
}

async function upsertToSupabase(rows) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("Skipping Supabase upsert; missing SUPABASE credentials");
    return;
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/spy_opportunities`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows.map((row) => ({
      platform: row.platform,
      slug: row.slug,
      title: row.title,
      payout_low: row.payout_low,
      payout_high: row.payout_high,
      description: row.description,
      tags: row.tags,
      url: row.url,
      last_seen_at: row.last_seen_at,
      status: "new",
    }))),
  });
  if (!res.ok) {
    const details = await res.text();
    throw new Error(`Supabase upsert failed: ${res.status} ${details}`);
  }
}

async function main() {
  const raw = await fetchGitcoin();
  const normalized = raw.map(normalize);
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(normalized, null, 2));
  await upsertToSupabase(normalized);
  console.log(`Normalized + synced ${normalized.length} Gitcoin opportunities`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
