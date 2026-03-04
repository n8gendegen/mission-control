#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { logActivity } from "../shared/log-activity.js";

function buildClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function dispatchAgentWork() {
  const client = buildClient();
  const { data, error } = await client
    .from("agent_work_sessions")
    .select("id, task_id, task_slug, task_title, agent_name, metadata")
    .eq("status", "triggered")
    .order("triggered_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load agent work sessions: ${error.message}`);
  }

  let processed = 0;
  for (const session of data ?? []) {
    const startedAt = new Date().toISOString();
    const { error: updateError } = await client
      .from("agent_work_sessions")
      .update({ status: "started", started_at: startedAt, updated_at: startedAt })
      .eq("id", session.id)
      .eq("status", "triggered");

    if (updateError) {
      console.error(`Failed to mark ${session.task_slug ?? session.task_id} as started:`, updateError.message ?? updateError);
      continue;
    }

    const summaryTarget = session.task_slug ?? session.task_title ?? session.task_id;
    await logActivity({
      eventType: "agent_work_started",
      summary: `${session.agent_name} started ${summaryTarget}`,
      actor: "AgentDispatcher",
      source: "agent-dispatcher",
      entityType: "task",
      entityId: session.task_id,
      metadata: {
        agent: session.agent_name,
        slug: session.task_slug,
      },
    });

    console.log(`[dispatch] ${session.agent_name} starting ${summaryTarget}`);
    processed += 1;
  }

  console.log(`Dispatch complete. started=${processed}`);
}

dispatchAgentWork().catch((err) => {
  console.error("Agent dispatcher failed:", err);
  process.exit(1);
});
