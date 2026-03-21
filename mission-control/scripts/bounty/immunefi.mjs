#!/usr/bin/env node
import "dotenv/config";
import fetch from "node-fetch";
import { promises as fs } from "fs";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SOURCE_URL = "https://immunefi.com/bug-bounty/";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const fileArg = args.find((arg) => arg.startsWith("--file="));
const filePath = fileArg ? fileArg.split("=")[1] : null;

if (!dryRun && (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = dryRun ? null : createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function scoreOpportunity(maxBounty) {
  const max = Number(maxBounty || 0);
  if (max >= 1000000) return { payoutBand: "legendary", score: 98 };
  if (max >= 250000) return { payoutBand: "high", score: 85 };
  if (max >= 50000) return { payoutBand: "mid", score: 70 };
  if (max >= 10000) return { payoutBand: "starter", score: 55 };
  return { payoutBand: "low", score: 35 };
}

async function fetchHtml() {
  if (filePath) {
    return fs.readFile(filePath, "utf8");
  }

  const resp = await fetch(SOURCE_URL, {
    headers: {
      "User-Agent": "mission-control-bounty-runner/1.0",
      Accept: "text/html,application/xhtml+xml,application/xml",
    },
  });

  if (!resp.ok) {
    throw new Error(`Immunefi fetch failed ${resp.status}`);
  }

  return resp.text();
}

function parsePrograms(html) {
  const startToken = '{\\"contentfulId\\"';
  const endToken = '],\\"title\\":\\"Bug Bounties\\"';
  const start = html.indexOf(startToken);
  const end = html.indexOf(endToken);

  if (start === -1 || end === -1) {
    throw new Error("Could not locate Immunefi program payload in HTML stream");
  }

  const escapedChunk = html.slice(start, end + 1);
  const decodedString = JSON.parse(`"${escapedChunk}"`);
  const jsonText = `[${decodedString}`;
  const programs = JSON.parse(jsonText);

  if (!Array.isArray(programs) || programs.length === 0) {
    throw new Error("Parsed Immunefi payload but no programs were found");
  }

  return programs;
}

function collectTags(program) {
  const bag = new Set();
  const tagGroups = program.tags || {};
  Object.values(tagGroups).forEach((value) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.filter(Boolean).forEach((tag) => bag.add(String(tag)));
    } else {
      bag.add(String(value));
    }
  });

  (program.features || []).forEach((feature) => {
    if (feature) bag.add(String(feature));
  });

  return Array.from(bag);
}

function buildSummary(program) {
  const ecosystems = (program.tags?.ecosystem || []).slice(0, 5).join(", ");
  const productTypes = (program.tags?.productType || []).slice(0, 4).join(", ");
  const bounty = Number(program.maxBounty || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  const parts = [`Max bounty ${bounty}`];
  if (ecosystems) parts.push(`ecosystems: ${ecosystems}`);
  if (productTypes) parts.push(`products: ${productTypes}`);
  return parts.join(" | ");
}

function mapProgram(program) {
  const maxBounty = Number(program.maxBounty || 0);
  const { payoutBand, score } = scoreOpportunity(maxBounty);
  const listingUrl = `https://immunefi.com${program.url}`;

  return {
    source: "immunefi",
    external_id: program.slug,
    title: program.project || program.slug,
    summary: buildSummary(program),
    tags: collectTags(program),
    payout_usd: maxBounty,
    listing_url: listingUrl,
    repo_url: null,
    fit_score: score,
    metadata: {
      payout_band: payoutBand,
      invite_only: Boolean(program.inviteOnly),
      premium: Boolean(program.isPremiumProgram),
      safe_harbor: Boolean(program.isSafeHarborActive),
      proof_of_concept: program.proofOfConceptType,
      tags: program.tags || {},
      features: program.features || [],
      performance: program.performanceMetrics || {},
    },
  };
}

async function logRunSummary({ processed, inserted, errors }) {
  const agentId = "runner:bounty:immunefi";
  const now = new Date().toISOString();
  const payload = {
    agent_id: agentId,
    agent_name: "Immunefi Connector",
    lane: "bounty",
    status: errors > 0 ? (inserted ? "warning" : "error") : "ok",
    last_run_at: now,
    last_duration_ms: null,
    next_run_eta: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    metadata: { processed, inserted, errors },
    updated_at: now,
  };

  if (!supabase) return;

  await supabase.from("agent_health_status").upsert(payload, {
    onConflict: "agent_id",
  });
}

async function main() {
  const html = await fetchHtml();
  const programs = parsePrograms(html);
  const mapped = programs.map(mapProgram);
  const processed = mapped.length;

  if (dryRun) {
    console.log(`[immunefi] dry-run processed=${processed}`);
    console.log(JSON.stringify(mapped.slice(0, 3), null, 2));
    return;
  }

  let inserted = 0;
  let errors = 0;

  try {
    const { error } = await supabase.from("spy_opportunities").upsert(mapped, {
      onConflict: "source,external_id",
    });

    if (error) {
      errors += 1;
      throw new Error(`Supabase upsert failed: ${error.message}`);
    }

    inserted = mapped.length;
  } catch (err) {
    errors += errors ? 0 : 1;
    throw err;
  } finally {
    console.log(`[immunefi] processed=${processed} inserted=${inserted} errors=${errors}`);
    await logRunSummary({ processed, inserted, errors });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
