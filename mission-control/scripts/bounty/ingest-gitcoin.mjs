#!/usr/bin/env node
import "dotenv/config";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const API_URL = process.env.GITCOIN_API_URL || "https://gitcoin-production-api.fly.dev/api/grants";
const OUTPUT = path.join(process.cwd(), "data", "bounty", "gitcoin-opportunities.json");

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

async function main() {
  const raw = await fetchGitcoin();
  const normalized = raw.map(normalize);
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(normalized, null, 2));
  console.log(`Normalized ${normalized.length} Gitcoin opportunities -> ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
