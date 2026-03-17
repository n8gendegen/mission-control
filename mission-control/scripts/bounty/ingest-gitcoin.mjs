#!/usr/bin/env node
import "dotenv/config";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const OUTPUT = path.join(process.cwd(), "data", "bounty", "gitcoin-latest.json");
const API_URL = process.env.GITCOIN_API_URL || "https://gitcoin-production-api.fly.dev/api/grants";

async function pullGitcoinGrants() {
  const res = await fetch(`${API_URL}?limit=50`);
  if (!res.ok) {
    throw new Error(`Gitcoin fetch failed: ${res.status}`);
  }
  const payload = await res.json();
  return payload?.data ?? [];
}

async function main() {
  const rows = await pullGitcoinGrants();
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(rows, null, 2));
  console.log(`Wrote ${rows.length} Gitcoin rows -> ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
