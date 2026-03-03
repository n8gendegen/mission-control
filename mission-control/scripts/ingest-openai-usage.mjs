#!/usr/bin/env node
/**
 * Aggregate OpenAI usage exports + agent attribution logs into daily records that the
 * Mission Control Data tab can consume.
 *
 * Usage:
 *   node scripts/ingest-openai-usage.mjs \
 *     --source data/usage/source/openai-usage.json \
 *     --attribution data/usage/source/attribution-log.jsonl \
 *     --out data/usage/daily.json \
 *     [--date 2026-03-01] [--start 2026-02-20 --end 2026-02-29]
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_SOURCE = "data/usage/source/openai-usage.json";
const DEFAULT_ATTRIBUTION = "data/usage/source/attribution-log.jsonl";
const DEFAULT_OUT = "data/usage/daily.json";

const args = process.argv.slice(2);
const options = {
  source: DEFAULT_SOURCE,
  attribution: DEFAULT_ATTRIBUTION,
  out: DEFAULT_OUT,
  date: null,
  start: null,
  end: null,
  supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || null,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || null,
};

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  switch (arg) {
    case "--source":
      options.source = args[i + 1];
      i += 1;
      break;
    case "--attribution":
      options.attribution = args[i + 1];
      i += 1;
      break;
    case "--out":
      options.out = args[i + 1];
      i += 1;
      break;
    case "--date":
      options.date = args[i + 1];
      i += 1;
      break;
    case "--start":
      options.start = args[i + 1];
      i += 1;
      break;
    case "--end":
      options.end = args[i + 1];
      i += 1;
      break;
    case "--supabase-url":
      options.supabaseUrl = args[i + 1];
      i += 1;
      break;
    case "--supabase-key":
      options.supabaseKey = args[i + 1];
      i += 1;
      break;
    default:
      break;
  }
}

function toDateString(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function recordKey(row) {
  return `${row.date}|${row.provider}|${row.model}`;
}

async function readJsonMaybe(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function readJsonl(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return raw
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch (error) {
          console.warn(`Skipping invalid JSONL line: ${line}`);
          return null;
        }
      })
      .filter(Boolean);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

function normalizeOpenAIUsage(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data
      .map((item) => ({
        date: item.date || (item.aggregation_timestamp ? toDateString(item.aggregation_timestamp * 1000) : undefined),
        provider: item.provider || "openai",
        model: item.model || item.snapshot_id || "unknown",
        total_tokens:
          item.total_tokens ?? item.n_tokens ?? item.n_total_tokens ?? item.tokens?.total ?? item.input_tokens + item.output_tokens ?? 0,
        total_cost_usd: item.total_cost ?? item.cost ?? item.cost_usd ?? 0,
      }))
      .filter((row) => row.date && row.model);
  }

  if (Array.isArray(payload?.daily_costs)) {
    const rows = [];
    for (const day of payload.daily_costs) {
      const date = toDateString(day.timestamp * 1000);
      for (const item of day.line_items ?? []) {
        rows.push({
          date,
          provider: "openai",
          model: item.name || item.model || "unknown",
          total_tokens: item.tokens ?? item.num_tokens ?? 0,
          total_cost_usd: item.cost || item.amount || item.cost_including_discount || 0,
        });
      }
    }
    return rows;
  }

  throw new Error("Unsupported OpenAI usage payload format");
}

function withinRange(date, { date: exact, start, end }) {
  if (exact) {
    return date === exact;
  }
  if (start && date < start) {
    return false;
  }
  if (end && date > end) {
    return false;
  }
  return true;
}

function mergeBreakdown(entries, keyField) {
  const map = new Map();
  for (const entry of entries) {
    const key = entry[keyField] || "Unattributed";
    if (!map.has(key)) {
      map.set(key, { name: key, tokens: 0, cost_usd: 0, task_url: entry.task_url });
    }
    const bucket = map.get(key);
    bucket.tokens += entry.tokens || 0;
    bucket.cost_usd += entry.cost_usd || 0;
    if (!bucket.task_url && entry.task_url) {
      bucket.task_url = entry.task_url;
    }
  }
  return Array.from(map.values());
}

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

async function main() {
  const sourcePath = path.resolve(options.source);
  const attributionPath = path.resolve(options.attribution);
  const outPath = path.resolve(options.out);

  const usageRaw = await readJsonMaybe(sourcePath);
  if (!usageRaw) {
    throw new Error(`Missing provider usage file at ${sourcePath}`);
  }
  const usageRows = normalizeOpenAIUsage(usageRaw);

  const attributionEntries = await readJsonl(attributionPath);
  const attributionIndex = new Map();
  for (const entry of attributionEntries) {
    const date = entry.date || (entry.timestamp ? toDateString(entry.timestamp) : null);
    if (!date) continue;
    const provider = entry.provider || "openai";
    const model = entry.model || entry.snapshot_id || "unknown";
    const key = recordKey({ date, provider, model });
    if (!attributionIndex.has(key)) {
      attributionIndex.set(key, []);
    }
    attributionIndex.get(key).push({
      ...entry,
      date,
      provider,
      model,
    });
  }

  const range = {
    date: options.date,
    start: options.start,
    end: options.end,
  };

  const existing = (await readJsonMaybe(outPath)) || [];
  const recordMap = new Map(existing.map((record) => [recordKey(record), record]));

  const supabaseRows = [];

  for (const row of usageRows) {
    if (!withinRange(row.date, range)) continue;

    const key = recordKey(row);
    const matches = attributionIndex.get(key) || [];
    const breakdownAgents = [];
    const breakdownProjects = [];

    const totalTokens = Number(row.total_tokens) || 0;
    const totalCost = roundCurrency(Number(row.total_cost_usd) || 0);

    for (const match of matches) {
      const tokens = Number(match.tokens) || 0;
      const tokensRatio = totalTokens > 0 ? tokens / totalTokens : 0;
      const cost = match.cost_usd != null ? Number(match.cost_usd) : roundCurrency(totalCost * tokensRatio);
      breakdownAgents.push({
        agent: match.agent || "Unattributed",
        tokens,
        cost_usd: cost,
        task_url: match.task_url,
      });
      breakdownProjects.push({
        project: match.project || "Unattributed",
        tokens,
        cost_usd: cost,
        task_url: match.task_url,
      });
    }

    const normalizedAgents = mergeBreakdown(breakdownAgents, "agent");
    const normalizedProjects = mergeBreakdown(breakdownProjects, "project");

    const sumTokensAgents = normalizedAgents.reduce((acc, item) => acc + item.tokens, 0);
    const sumCostAgents = normalizedAgents.reduce((acc, item) => acc + item.cost_usd, 0);

    if (sumTokensAgents < totalTokens * 0.98 || sumCostAgents < totalCost * 0.98) {
      normalizedAgents.push({
        name: "Unattributed",
        tokens: Math.max(0, totalTokens - sumTokensAgents),
        cost_usd: roundCurrency(Math.max(0, totalCost - sumCostAgents)),
      });
    }

    const sumTokensProjects = normalizedProjects.reduce((acc, item) => acc + item.tokens, 0);
    const sumCostProjects = normalizedProjects.reduce((acc, item) => acc + item.cost_usd, 0);

    if (sumTokensProjects < totalTokens * 0.98 || sumCostProjects < totalCost * 0.98) {
      normalizedProjects.push({
        name: "Unattributed",
        tokens: Math.max(0, totalTokens - sumTokensProjects),
        cost_usd: roundCurrency(Math.max(0, totalCost - sumCostProjects)),
      });
    }

    const aggregateRecord = {
      date: row.date,
      provider: row.provider || "openai",
      model: row.model,
      total_tokens: totalTokens,
      total_cost_usd: totalCost,
      by_agent: normalizedAgents,
      by_project: normalizedProjects,
    };

    recordMap.set(key, aggregateRecord);
    supabaseRows.push(aggregateRecord);
  }

  const nextRecords = Array.from(recordMap.values()).sort((a, b) => {
    if (a.date === b.date) {
      return `${a.provider}-${a.model}`.localeCompare(`${b.provider}-${b.model}`);
    }
    return a.date.localeCompare(b.date);
  });

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(nextRecords, null, 2)}\n`);

  console.log(`Updated ${outPath} with ${usageRows.length} provider rows (filtered to range)`);

  if (options.supabaseUrl && options.supabaseKey && supabaseRows.length > 0) {
    await upsertIntoSupabase(options.supabaseUrl, options.supabaseKey, supabaseRows);
  } else if (supabaseRows.length === 0) {
    console.log("No rows matched range; skipping Supabase upsert");
  } else {
    console.warn("Supabase URL/key not provided; skipping Supabase upsert");
  }
}

async function upsertIntoSupabase(url, key, rows) {
  const client = createClient(url, key, { auth: { persistSession: false } });

  const payload = rows.map((row) => ({
    date: row.date,
    provider: row.provider,
    model: row.model,
    total_tokens: row.total_tokens,
    total_cost_usd: row.total_cost_usd,
    by_agent: row.by_agent,
    by_project: row.by_project,
  }));

  const { error } = await client.from("usage_daily_aggregates").upsert(payload, {
    onConflict: "date,provider,model",
  });

  if (error) {
    throw new Error(`Failed to upsert Supabase aggregates: ${error.message}`);
  }

  console.log(`Upserted ${payload.length} rows into Supabase usage_daily_aggregates`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
