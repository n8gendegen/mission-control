#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { logActivity } = require("../shared/log-activity.js");

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }
  return value;
}

function parseTaskSlug(branchName) {
  if (!branchName?.startsWith("auto/")) return null;
  const remainder = branchName.slice(5);
  const idx = remainder.indexOf("-builder-");
  if (idx === -1) return null;
  return remainder.slice(0, idx);
}

async function completeTask(client, taskSlug) {
  const now = new Date().toISOString();
  const { data, error } = await client
    .from("tasks")
    .update({
      column_id: "rev",
      status: "done",
      completed_at: now,
      updated_at: now,
    })
    .eq("slug", taskSlug)
    .select("id, title")
    .single();

  if (error) {
    throw new Error(`Failed to update task ${taskSlug}: ${error.message}`);
  }
  return data;
}

async function main() {
  const branchName = process.env.BUILDER_BRANCH_NAME;
  const taskSlug = parseTaskSlug(branchName);
  if (!taskSlug) {
    console.log(`No task slug detected in branch ${branchName}`);
    return;
  }

  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const task = await completeTask(client, taskSlug);

  await logActivity({
    eventType: "task_completed",
    summary: `${task.title} auto-completed via builder merge`,
    actor: process.env.GITHUB_MERGED_BY || "builder-bot",
    source: "auto-complete-builder",
    entityType: "task",
    entityId: task.id,
    metadata: {
      task_slug: taskSlug,
      branch: branchName,
      pr_number: process.env.GITHUB_PR_NUMBER,
      pr_url: process.env.GITHUB_PR_HTML_URL,
      merge_commit: process.env.GITHUB_SHA,
    },
  });

  console.log(`Marked ${taskSlug} complete and logged activity.`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
