#!/usr/bin/env node
import "dotenv/config";
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const API_URL = "https://api.hackerone.com/v1/graphql";
const TOKEN = process.env.HACKERONE_API_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!TOKEN) {
  console.error("Missing HACKERONE_API_TOKEN");
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const QUERY = `
  query DirectoryPrograms($after: String) {
    me {
      directoryPrograms(first: 50, after: $after, filter: { offersBounties: true }) {
        edges {
          node {
            id
            handle
            name
            submissionTypes
            offersBounties
            averageBounty
            maxBounty
            assets { assetIdentifier assetType }
            profileUrl
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }
`;

function scoreOpportunity(node) {
  const max = Number(node.maxBounty || 0);
  if (max >= 10000) return { payoutBand: "legendary", score: 95 };
  if (max >= 5000) return { payoutBand: "high", score: 80 };
  if (max >= 2500) return { payoutBand: "mid", score: 65 };
  if (max >= 1000) return { payoutBand: "starter", score: 45 };
  return { payoutBand: "low", score: 20 };
}

async function fetchPage(cursor = null) {
  const resp = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/json",
    },
    body: JSON.stringify({ query: QUERY, variables: { after: cursor } }),
  });

  if (!resp.ok) {
    throw new Error(`HackerOne API error ${resp.status}`);
  }

  const payload = await resp.json();
  return payload.data?.me?.directoryPrograms;
}

async function logRunSummary({ processed, inserted, errors }) {
  const agentId = "runner:bounty:hackerone";
  const now = new Date().toISOString();
  const payload = {
    agent_id: agentId,
    agent_name: "HackerOne Connector",
    lane: "bounty",
    status: errors > 0 ? (inserted ? "warning" : "error") : "ok",
    last_run_at: now,
    last_duration_ms: null,
    next_run_eta: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    metadata: { processed, inserted, errors },
    updated_at: now,
  };

  await supabase.from("agent_health_status").upsert(payload, { onConflict: "agent_id" });
}

async function main() {
  let cursor = null;
  let inserted = 0;
  let processed = 0;
  let errors = 0;

  try {
    do {
      const page = await fetchPage(cursor);
      if (!page) break;

      cursor = page.pageInfo?.hasNextPage ? page.pageInfo.endCursor : null;
      const batch = (page.edges || [])
        .map(({ node }) => node)
        .filter((node) => Number(node.maxBounty || 0) >= 1000)
        .map((node) => {
          const { payoutBand, score } = scoreOpportunity(node);
          processed += 1;
          return {
            slug: node.handle,
            platform: "hackerone",
            title: node.name,
            payout_high: Number(node.maxBounty || 0),
            payout_low: Number(node.averageBounty || 0),
            scope: node.assets,
            submission_types: node.submissionTypes,
            signals: { source: "hackerone", payout_band: payoutBand },
            score,
            source_url: node.profileUrl,
          };
        });

      if (batch.length) {
        const { error } = await supabase.from("spy_opportunities").upsert(batch, {
          onConflict: "slug",
        });
        if (error) {
          errors += 1;
          console.error("Supabase upsert failed", error.message);
        } else {
          inserted += batch.length;
        }
      }
    } while (cursor);
  } catch (err) {
    errors += 1;
    throw err;
  } finally {
    console.log(`[hackerone] processed=${processed} inserted=${inserted} errors=${errors}`);
    await logRunSummary({ processed, inserted, errors });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
