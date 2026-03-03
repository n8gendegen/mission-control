#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";

const DEFAULT_LIMIT = Number(process.env.AUTO_ASSIGN_LIMIT ?? 30);
const DEFAULT_MAX_ACTIVE = Number(process.env.AUTO_ASSIGN_MAX_ACTIVE ?? 5);

const AGENT_CONFIG = [
  {
    name: "Henry",
    initials: "H",
    maxActive: 4,
    roles: ["orchestrator", "infra", "approvals"],
    keywords: [/arch(itecture|)/i, /coordination/i, /mission control/i],
    lanes: ["mission control", "concierge", "infra", "ops"],
  },
  {
    name: "Steve",
    initials: "St",
    maxActive: 6,
    roles: ["builder", "coder"],
    keywords: [/build/i, /implement/i, /next\.?js/i, /api/i, /test/i, /automation/i, /pr\b/i],
    lanes: ["bounty lane", "concierge", "mission control"],
  },
  {
    name: "Spy",
    initials: "Sp",
    maxActive: 5,
    roles: ["research"],
    keywords: [/research/i, /monitor/i, /scan/i, /intel/i, /bounty/i, /market/i],
    lanes: ["bounty lane", "revenue lab", "intel"],
  },
  {
    name: "Splitter",
    initials: "Spl",
    maxActive: 5,
    roles: ["scoping"],
    keywords: [/spec/i, /scope/i, /decompose/i, /definition/i, /brief/i, /checklist/i],
    lanes: ["revenue lab", "concierge", "bounty lane"],
  },
  {
    name: "Janet",
    initials: "J",
    maxActive: 4,
    roles: ["infra", "security"],
    keywords: [/schema/i, /supabase/i, /policy/i, /infra/i, /logging/i, /observability/i, /cost/i],
    lanes: ["infra", "mission control"],
  },
  {
    name: "Sweeper",
    initials: "Sw",
    maxActive: 4,
    roles: ["cleanup", "docs"],
    keywords: [/cleanup/i, /refactor/i, /docs?/i, /readme/i, /changelog/i],
    lanes: ["mission control", "concierge"],
  },
];

const AGENT_BY_NAME = Object.fromEntries(AGENT_CONFIG.map((agent) => [agent.name, agent]));
const AGENT_INITIALS = new Set(AGENT_CONFIG.map((agent) => agent.initials));

const LANE_ROUTING = {
  "bounty lane": ["Spy", "Splitter", "Steve"],
  "revenue lab": ["Spy", "Splitter", "Henry"],
  concierge: ["Splitter", "Steve", "Henry"],
  infra: ["Janet", "Henry"],
  "mission control": ["Henry", "Steve", "Sweeper"],
  intel: ["Spy", "Henry"],
};

const KEYWORD_ROUTING = [
  { pattern: /(build|implement|next\.?js|api|playwright|automation|test|ci|deploy)/i, agent: "Steve" },
  { pattern: /(spec|scope|brief|breakdown|definition|backlog)/i, agent: "Splitter" },
  { pattern: /(monitor|research|intel|scan|bounty|market|watch)/i, agent: "Spy" },
  { pattern: /(schema|supabase|policy|infra|observability|logging|cost)/i, agent: "Janet" },
  { pattern: /(cleanup|docs?|refactor|readme|changelog|roster)/i, agent: "Sweeper" },
  { pattern: /(architecture|orchestrat|multi-agent|review)/i, agent: "Henry" },
];

const APPROVAL_LANES = new Set(["approvals", "approval queue"]);
const APPROVAL_KEYWORDS = [/requires approval/i, /awaiting approval/i];

const DEFAULT_FALLBACK = ["Henry", "Splitter"];

function parseArgs(argv) {
  const args = { limit: DEFAULT_LIMIT, dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--supabase-url":
        args.supabaseUrl = argv[++i];
        break;
      case "--supabase-key":
        args.supabaseKey = argv[++i];
        break;
      case "--limit":
        args.limit = Number(argv[++i]);
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--help":
        printHelp();
        process.exit(0);
      default:
        if (arg.startsWith("--")) {
          console.warn(`Unknown flag: ${arg}`);
        }
    }
  }
  return args;
}

function printHelp() {
  console.log(`Mission Control auto-assignment worker\n\n`);
  console.log(`Options:\n  --supabase-url   Override Supabase URL\n  --supabase-key   Override service role key\n  --limit          Max tasks per run (default: ${DEFAULT_LIMIT})\n  --dry-run        Do not persist changes`);
}

function buildClient({ supabaseUrl, supabaseKey }) {
  const url =
    supabaseUrl || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function fetchAgentLoads(client) {
  const { data, error } = await client
    .from("tasks")
    .select("owner_initials,column_id")
    .not("column_id", "eq", "done");
  if (error) throw new Error(`Failed to fetch agent loads: ${error.message}`);
  const counts = Object.fromEntries(AGENT_CONFIG.map((agent) => [agent.name, 0]));
  for (const row of data ?? []) {
    const agent = AGENT_CONFIG.find((cfg) => cfg.initials === row.owner_initials);
    if (!agent) continue;
    counts[agent.name] += 1;
  }
  return counts;
}

async function fetchCandidateTasks(client, limit) {
  const { data, error } = await client
    .from("tasks")
    .select("id, slug, title, description, column_id, owner_initials, project, source, status, updated_at")
    .in("column_id", ["backlog", "rev"])
    .or("owner_initials.is.null,owner_initials.eq.''")
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`Failed to fetch backlog tasks: ${error.message}`);
  return data ?? [];
}

function textForTask(task) {
  return `${task.title ?? ""} ${task.description ?? ""}`.toLowerCase();
}

function requiresApproval(task) {
  const column = (task.column_id ?? "").toLowerCase();
  const lane = (task.project ?? "").toLowerCase();
  const source = (task.source ?? "").toLowerCase();
  if (APPROVAL_LANES.has(column) || APPROVAL_LANES.has(lane) || source === "approvals") {
    return true;
  }
  const text = textForTask(task);
  return APPROVAL_KEYWORDS.some((pattern) => pattern.test(text));
}

function routeByLane(task) {
  const lane = (task.project ?? "").toLowerCase();
  if (LANE_ROUTING[lane]) return [...LANE_ROUTING[lane]];
  const column = (task.column_id ?? "").toLowerCase();
  if (LANE_ROUTING[column]) return [...LANE_ROUTING[column]];
  return [];
}

function routeByKeywords(task) {
  const text = textForTask(task);
  for (const rule of KEYWORD_ROUTING) {
    if (rule.pattern.test(text)) {
      return rule.agent;
    }
  }
  return null;
}

function pickAgent(task, agentLoads) {
  const laneCandidates = routeByLane(task);
  const keywordAgent = routeByKeywords(task);
  const combined = new Set([
    ...laneCandidates,
    ...(keywordAgent ? [keywordAgent] : []),
    ...DEFAULT_FALLBACK,
  ]);
  const reasons = [];
  if (laneCandidates.length) {
    reasons.push(`lane=${task.project ?? task.column_id}`);
  }
  if (keywordAgent) {
    reasons.push(`keyword=${keywordAgent}`);
  }

  for (const agentName of combined) {
    const agent = AGENT_BY_NAME[agentName];
    if (!agent) continue;
    const maxActive = agent.maxActive ?? DEFAULT_MAX_ACTIVE;
    const load = agentLoads[agent.name] ?? 0;
    if (load < maxActive) {
      return { agent, reason: reasons.join("; ") };
    }
  }
  return null;
}

async function assignTask({ client, task, agent, reason, dryRun }) {
  const updates = {
    owner_initials: agent.initials,
    updated_at: new Date().toISOString(),
  };
  if (task.column_id === "backlog") {
    updates.column_id = "in_progress";
  }

  if (dryRun) {
    return { updated: true };
  }

  const updateQuery = client
    .from("tasks")
    .update(updates)
    .eq("id", task.id)
    .eq("updated_at", task.updated_at);

  const { error } = await updateQuery;
  if (error) throw new Error(`Failed to update task ${task.slug ?? task.id}: ${error.message}`);

  const detail = {
    auto: true,
    reason,
    assigned_to: agent.name,
    column_from: task.column_id,
    column_to: updates.column_id ?? task.column_id,
  };

  const { error: logError } = await client.from("activity_log").insert({
    task_id: task.id,
    owner: "AutoRouter",
    summary: `Auto-assigned to ${agent.name}`,
    details: JSON.stringify(detail),
  });
  if (logError) {
    console.warn(`Failed to log activity for ${task.slug ?? task.id}: ${logError.message}`);
  }
  return { updated: true };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const client = buildClient(args);
  const dryRun = Boolean(args.dryRun);

  const [agentLoads, candidates] = await Promise.all([
    fetchAgentLoads(client),
    fetchCandidateTasks(client, args.limit ?? DEFAULT_LIMIT),
  ]);

  const results = {
    assigned: [],
    skipped: [],
    approvals: [],
  };

  for (const task of candidates) {
    if (requiresApproval(task)) {
      results.approvals.push(task);
      continue;
    }
    const recommendation = pickAgent(task, agentLoads);
    if (!recommendation) {
      results.skipped.push({ task, reason: "capacity" });
      continue;
    }
    const { agent, reason } = recommendation;
    try {
      await assignTask({ client, task, agent, reason, dryRun });
      agentLoads[agent.name] = (agentLoads[agent.name] ?? 0) + 1;
      results.assigned.push({ task, agent, reason });
      console.log(
        `${dryRun ? "[dry-run]" : "[assigned]"} ${task.slug ?? task.title} -> ${agent.name} (${reason || "default"})`
      );
    } catch (err) {
      console.error(`Failed to assign ${task.slug ?? task.id}:`, err.message ?? err);
      results.skipped.push({ task, reason: err.message ?? "error" });
    }
  }

  console.log(
    `Auto-assign complete. assigned=${results.assigned.length} approvals_blocked=${results.approvals.length} skipped=${results.skipped.length}`
  );

  if (dryRun) {
    console.log("Dry-run mode: no changes saved.");
  }
}

main().catch((err) => {
  console.error("Auto-assign worker failed:", err);
  process.exit(1);
});
