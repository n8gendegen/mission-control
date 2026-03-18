#!/usr/bin/env node
import "dotenv/config";

const REQUIRED = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LIMIT = Number(process.env.AGENT_ALERT_LIMIT || 5);
const TARGET_COLUMN = process.env.AGENT_ALERT_RESET_COLUMN || "backlog";

async function fetchAlerts() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/agent_alerts?status=eq.open&order=created_at.asc&limit=${LIMIT}`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    }
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch alerts: ${res.status}`);
  }
  return res.json();
}

async function resetTask(alert) {
  if (!alert.task_id) {
    return { status: "skipped", reason: "missing task" };
  }
  const payload = {
    owner_initials: null,
    column_id: TARGET_COLUMN,
    updated_at: new Date().toISOString(),
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${alert.task_id}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    return { status: "error", reason: await res.text() };
  }
  return { status: "reassigned" };
}

async function closeAlert(id, result) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/agent_alerts?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ status: result.status, updated_at: new Date().toISOString(), metadata: { ...(result.reason ? { reason: result.reason } : {}) } }),
  });
  if (!res.ok) {
    console.error("Failed to close alert", id, await res.text());
  }
}

async function main() {
  const alerts = await fetchAlerts();
  if (!alerts.length) {
    console.log("No idle agents to process");
    return;
  }
  for (const alert of alerts) {
    const result = await resetTask(alert);
    await closeAlert(alert.id, result);
    console.log(`[alert] ${alert.agent_name} -> ${alert.task_slug || alert.task_id} => ${result.status}`);
  }
}

main().catch((err) => {
  console.error("auto-reassign failed", err);
  process.exit(1);
});
