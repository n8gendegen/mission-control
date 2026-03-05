#!/usr/bin/env node
import 'dotenv/config';
import { Client } from 'pg';

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;
const GITHUB_BOUNTY_TOKEN = process.env.GITHUB_BOUNTY_TOKEN || process.env.GITHUB_TOKEN;
const DRY_RUN = process.env.DRY_RUN === '1';

if (!SUPABASE_DB_URL) {
  console.error('Missing SUPABASE_DB_URL env.');
  process.exit(1);
}

if (!GITHUB_BOUNTY_TOKEN) {
  console.error('Missing GITHUB_BOUNTY_TOKEN env.');
  process.exit(1);
}

const client = new Client({ connectionString: SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });

function formatClaimComment({ approval, opportunity }) {
  const lines = [];
  lines.push('/claim');
  lines.push('');
  lines.push(`Hey team, I’d like to tackle **${approval.title}**.`);
  lines.push('');
  lines.push('### Tech Stack');
  lines.push('- Contracts: Solidity 0.8.x, OpenZeppelin 5.x');
  lines.push('- Backend: Node.js + Fastify, Prisma, BullMQ, Redis');
  lines.push('- Frontend: Next.js 14, Tailwind/shadcn, wagmi v2');
  lines.push('- Storage: PostgreSQL + Pinata IPFS');
  lines.push('- Testing: Hardhat + Vitest (>80% coverage)');
  lines.push('');
  lines.push('### Timeline (2 weeks)');
  lines.push('- Week 1: Contracts + backend API + IPFS integration');
  lines.push('- Week 2: Frontend UI, SDK/docs, Docker, end-to-end tests');
  lines.push('');
  lines.push('### Key Deliverables');
  lines.push('- Metadata registry smart contract with submission/review lifecycle');
  lines.push('- Moderation-ready backend queue + REST API (ETag caching, rate limits)');
  lines.push('- Creator dashboard + explorer UI with wallet auth');
  lines.push('- SDK + documentation + docker-compose for local stack');
  lines.push('');
  lines.push('I’ll share progress updates mid-week and keep build notes in the repo. Ready to start as soon as you assign.');
  return lines.join('\n');
}

async function fetchTargets() {
  const { rows } = await client.query(
    `select a.id as approval_id,
            a.slug as approval_slug,
            a.title,
            a.summary,
            so.id as opportunity_id,
            so.repo_full_name,
            so.issue_number,
            so.listing_url,
            so.claim_status
       from approvals a
       join spy_opportunities so on so.id = a.opportunity_id
      where a.status = 'in-progress'
        and so.repo_full_name is not null
        and so.issue_number is not null
        and (so.claim_status = 'unclaimed' or so.claim_status = 'needs_followup');`
  );
  return rows;
}

async function postGithubComment({ repoFullName, issueNumber, body }) {
  const url = `https://api.github.com/repos/${repoFullName}/issues/${issueNumber}/comments`;
  if (DRY_RUN) {
    console.log(`[DRY RUN] Would post to ${url}`);
    return { html_url: null, dryRun: true };
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GITHUB_BOUNTY_TOKEN}`,
      'User-Agent': 'mission-control-spy',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub comment failed (${res.status}): ${text}`);
  }
  return await res.json();
}

async function updateOpportunity(opportunityId, commentUrl) {
  await client.query(
    `update spy_opportunities
        set claim_status = 'claimed',
            claim_comment_url = coalesce($2, claim_comment_url),
            last_claim_check = timezone('utc', now())
      where id = $1`,
    [opportunityId, commentUrl]
  );
}

async function logActivity(approvalSlug, opportunity, commentUrl) {
  const summary = `Posted /claim for ${approvalSlug}`;
  await client.query(
    `insert into activity_log (event_type, source, actor, summary, entity_type, entity_id, metadata)
     values ($1,$2,$3,$4,$5,$6,$7)`,
    [
      'bounty_claim_posted',
      'spy-claims',
      'Spy',
      summary,
      'approval',
      approvalSlug,
      JSON.stringify({ opportunity_id: opportunity.opportunity_id, comment_url: commentUrl ?? null }),
    ]
  );
}

async function main() {
  await client.connect();
  try {
    const targets = await fetchTargets();
    if (!targets.length) {
      console.log('No unclaimed approvals found.');
      return;
    }

    for (const approval of targets) {
      const body = formatClaimComment({ approval, opportunity: approval });
      const response = await postGithubComment({
        repoFullName: approval.repo_full_name,
        issueNumber: approval.issue_number,
        body,
      });
      if (response?.dryRun) {
        continue;
      }
      await updateOpportunity(approval.opportunity_id, response?.html_url ?? null);
      await logActivity(approval.approval_slug, approval, response?.html_url ?? null);
      console.log(`Claimed ${approval.repo_full_name}#${approval.issue_number}`);
    }
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
