#!/usr/bin/env node
import 'dotenv/config';
import { Client } from 'pg';

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

if (!SUPABASE_DB_URL) {
  console.error('Missing SUPABASE_DB_URL env.');
  process.exit(1);
}

if (!GITHUB_TOKEN) {
  console.error('Missing GITHUB_TOKEN env.');
  process.exit(1);
}

const SOURCES = [
  {
    id: 'github:typescript-bounties',
    query: 'is:issue is:open label:bounty language:TypeScript',
    tags: ['typescript', 'nextjs', 'ai'],
    minPayout: 400,
    perPage: 20,
  },
  {
    id: 'github:nextjs-paid-fixes',
    query: 'is:issue is:open "Next.js" bounty language:TypeScript',
    tags: ['nextjs', 'typescript'],
    minPayout: 300,
    perPage: 15,
  },
];

const KEYWORDS = ['next.js', 'typescript', 'ai', 'automation', 'clerk', 'supabase'];

function summarize(text = '', limit = 480) {
  const clean = text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
  return clean.length <= limit ? clean : `${clean.slice(0, limit - 3)}...`;
}

function extractPayout(text = '') {
  const match = text.match(/\$\s?([0-9]{2,}(?:,[0-9]{3})*)/i);
  if (match) {
    return Number(match[1].replace(/,/g, ''));
  }
  const labelMatch = text.match(/payout\s*:?\s*([0-9]{2,})/i);
  if (labelMatch) {
    return Number(labelMatch[1]);
  }
  return null;
}

function repoHtmlUrl(apiUrl) {
  if (!apiUrl) return null;
  return apiUrl.replace('api.github.com/repos', 'github.com');
}

function repoFullName(apiUrl) {
  if (!apiUrl) return null;
  const segments = apiUrl.split('repos/')[1];
  return segments ?? null;
}

function computeFitScore({ payoutUsd, tags = [] }) {
  let score = 0;
  if (payoutUsd) {
    if (payoutUsd >= 1500) score += 50;
    else if (payoutUsd >= 800) score += 35;
    else if (payoutUsd >= 400) score += 20;
  }
  const normalized = tags.map((t) => t.toLowerCase());
  KEYWORDS.forEach((keyword) => {
    if (normalized.some((tag) => tag.includes(keyword))) {
      score += 10;
    }
  });
  return Math.min(score, 100);
}

async function fetchGithubIssues(source) {
  const endpoint = new URL('https://api.github.com/search/issues');
  endpoint.searchParams.set('q', source.query);
  endpoint.searchParams.set('sort', 'created');
  endpoint.searchParams.set('order', 'desc');
  endpoint.searchParams.set('per_page', String(source.perPage ?? 20));

  const res = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'mission-control-spy-scan',
      Accept: 'application/vnd.github+json',
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API error (${res.status}): ${body}`);
  }

  const json = await res.json();
  return json.items ?? [];
}

function normalizeIssue(issue, source) {
  const labelNames = (issue.labels ?? []).map((label) =>
    typeof label === 'string' ? label : label.name
  );
  const payoutFromLabel = labelNames
    .map((label) => label?.match(/\$([0-9]+)/))
    .filter(Boolean)
    .map((match) => Number(match[1]))[0];
  const payoutFromBody = extractPayout(issue.body ?? '');
  const payoutUsd = payoutFromLabel ?? payoutFromBody ?? null;

  const tags = Array.from(
    new Set([
      ...(source.tags ?? []),
      ...(labelNames.filter(Boolean) ?? []),
    ])
  );

  const fitScore = computeFitScore({ payoutUsd, tags });

  return {
    source: source.id,
    externalId: issue.node_id ?? String(issue.id),
    title: issue.title,
    summary: summarize(issue.body ?? ''),
    tags,
    payoutUsd,
    listingUrl: issue.html_url,
    repoUrl: repoHtmlUrl(issue.repository_url),
    repoFullName: repoFullName(issue.repository_url),
    issueNumber: issue.number,
    fitScore,
    metadata: {
      sourceQuery: source.query,
      repo: issue.repository_url,
      number: issue.number,
      labels: labelNames,
      author: issue.user?.login,
      created_at: issue.created_at,
    },
  };
}

async function upsertSpyOpportunity(client, opportunity) {
  const values = [
    opportunity.source,
    opportunity.externalId,
    opportunity.title,
    opportunity.summary,
    opportunity.tags,
    opportunity.payoutUsd,
    opportunity.listingUrl,
    opportunity.repoUrl,
    opportunity.repoFullName,
    opportunity.issueNumber,
    opportunity.fitScore,
    JSON.stringify(opportunity.metadata ?? {}),
  ];

  const { rows } = await client.query(
    `insert into spy_opportunities 
      (source, external_id, title, summary, tags, payout_usd, listing_url, repo_url, repo_full_name, issue_number, fit_score, metadata)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     on conflict (source, external_id) do update set
       title = excluded.title,
       summary = excluded.summary,
       tags = excluded.tags,
       payout_usd = excluded.payout_usd,
       listing_url = excluded.listing_url,
       repo_url = excluded.repo_url,
       repo_full_name = excluded.repo_full_name,
       issue_number = excluded.issue_number,
       fit_score = excluded.fit_score,
       metadata = excluded.metadata,
       updated_at = timezone('utc', now())
     returning id, (xmax = 0) as inserted;`,
    values
  );

  return rows[0];
}

function buildApprovalPayload(opp) {
  const payout = opp.payoutUsd ?? 0;
  const estHours = payout ? Math.max(2, Math.min(16, payout / 150)) : null;
  const estMin = estHours ? Number((estHours * 0.8).toFixed(1)) : null;
  const estMax = estHours ? Number((estHours * 1.2).toFixed(1)) : null;
  const expectedProfit = payout ? Number((payout * 0.55).toFixed(2)) : null;
  const recommendation = payout >= 1000 || opp.fitScore >= 40 ? 'Strongly pursue' : 'Review';

  const slug = `approval-spy-${opp.externalId}`.toLowerCase();
  const summary = opp.summary || `${opp.title} (auto-imported by Spy)`;

  return {
    slug,
    title: opp.title,
    summary,
    technical_scope: opp.metadata?.repo ? `Repo: ${repoHtmlUrl(opp.metadata.repo)}` : null,
    payout_usd: opp.payoutUsd,
    time_estimate_hours_min: estMin,
    time_estimate_hours_max: estMax,
    token_estimate: null,
    token_cost_usd: null,
    expected_profit_usd: expectedProfit,
    recommendation,
    status: 'pending',
    repo_url: opp.repoUrl,
    listing_url: opp.listingUrl,
  };
}

async function ensureApproval(client, opp) {
  const approval = buildApprovalPayload(opp);
  const values = [
    approval.slug,
    approval.title,
    approval.summary,
    approval.technical_scope,
    approval.payout_usd,
    approval.time_estimate_hours_min,
    approval.time_estimate_hours_max,
    approval.token_estimate,
    approval.token_cost_usd,
    approval.expected_profit_usd,
    approval.recommendation,
    approval.status,
    approval.repo_url,
    approval.listing_url,
  ];

  await client.query(
    `insert into approvals (
      slug, title, summary, technical_scope, payout_usd,
      time_estimate_hours_min, time_estimate_hours_max, token_estimate,
      token_cost_usd, expected_profit_usd, recommendation, status, repo_url, listing_url
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    on conflict (slug) do update set
      title = excluded.title,
      summary = excluded.summary,
      technical_scope = excluded.technical_scope,
      payout_usd = excluded.payout_usd,
      time_estimate_hours_min = excluded.time_estimate_hours_min,
      time_estimate_hours_max = excluded.time_estimate_hours_max,
      expected_profit_usd = excluded.expected_profit_usd,
      recommendation = excluded.recommendation,
      repo_url = excluded.repo_url,
      listing_url = excluded.listing_url,
      updated_at = timezone('utc', now());`,
    values
  );

  return approval.slug;
}

async function logActivity(client, opp, approvalSlug) {
  const summary = opp.payoutUsd
    ? `Spy spotted $${opp.payoutUsd.toLocaleString()} bounty: ${opp.title}`
    : `Spy spotted bounty: ${opp.title}`;
  await client.query(
    `insert into activity_log (event_type, source, actor, summary, entity_type, entity_id, metadata)
     values ($1,$2,$3,$4,$5,$6,$7);`,
    [
      'spy_hit',
      opp.source,
      'Spy',
      summary,
      'approval',
      approvalSlug,
      JSON.stringify(opp.metadata ?? {}),
    ]
  );
}

(async () => {
  const client = new Client({ connectionString: SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const inserted = [];

  try {
    for (const source of SOURCES) {
      console.log(`Scanning ${source.id}...`);
      const issues = await fetchGithubIssues(source);
      for (const issue of issues) {
        const opp = normalizeIssue(issue, source);
        const minPayout = source.minPayout ?? 0;
        if ((opp.payoutUsd ?? 0) < minPayout && opp.fitScore < 30) {
          continue;
        }
        const result = await upsertSpyOpportunity(client, opp);
        if (result?.inserted) {
          const slug = await ensureApproval(client, opp);
          await logActivity(client, opp, slug);
          inserted.push({ title: opp.title, payout: opp.payoutUsd, source: opp.source });
          console.log(`  ↳ added ${opp.title} (${opp.payoutUsd ? `$${opp.payoutUsd}` : 'payout n/a'})`);
        }
      }
    }
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }

  if (!inserted.length) {
    console.log('No new high-fit opportunities found.');
  } else {
    console.log(`Inserted ${inserted.length} new opportunities.`);
  }
})();
