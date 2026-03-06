#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { logActivity } from "../shared/log-activity.js";

function getTaskSlug(branch) {
  if (!branch) return null;
  const match = branch.match(/^auto\/([^/]+?)(?:-builder.*)?$/i);
  return match ? match[1] : null;
}

(async function main() {
  const branchName = process.env.BUILDER_BRANCH_NAME || process.argv[2];
  const taskSlug = getTaskSlug(branchName);
  if (!taskSlug) {
    throw new Error(`Unable to parse task slug from branch: ${branchName}`);
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Supabase credentials are required");
  }

  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const now = new Date().toISOString();
  const { data, error } = await client
    .from("tasks")
    .update({
      column_id: "done",
      status: "done",
      completed_at: now,
      updated_at: now,
    })
    .eq("slug", taskSlug)
    .select("id, slug, title")
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Failed to update task ${taskSlug}: ${error?.message ?? "not found"}`);
  }

  await logActivity({
    eventType: "task_completed",
    summary: `${data.title ?? taskSlug} auto-completed via builder merge`,
    actor: process.env.GITHUB_MERGED_BY || "BuilderHarness",
    source: "builder-monitor",
    entityType: "task",
    entityId: data.id,
    metadata: {
      branch: branchName,
      task_slug: taskSlug,
      pr_number: process.env.GITHUB_PR_NUMBER,
      pr_url: process.env.GITHUB_PR_HTML_URL,
      commit: process.env.GITHUB_SHA,
    },
  });

  console.log(`Task ${taskSlug} marked done at ${now}`);
})();
