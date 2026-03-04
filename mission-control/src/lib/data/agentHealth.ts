import { getSupabaseClient } from "../supabase/client";

export type AgentHealthRecord = {
  id: string;
  agent_id: string;
  agent_name: string;
  lane: string | null;
  status: string;
  last_run_at: string | null;
  last_duration_ms: number | null;
  next_run_eta: string | null;
  error_context: string | null;
  metadata: Record<string, unknown> | null;
  updated_at: string;
};

const STATUS_ORDER: Record<string, number> = {
  error: 0,
  warning: 1,
  ok: 2,
  dry_run: 3,
  unknown: 4,
};

export async function getAgentHealth(limit = 12): Promise<AgentHealthRecord[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from("agent_health_status")
    .select("id,agent_id,agent_name,lane,status,last_run_at,last_duration_ms,next_run_eta,error_context,metadata,updated_at")
    .order("status", { ascending: true })
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error("Failed to load agent health status", error?.message ?? error);
    return [];
  }

  return data
    .map((row) => ({ ...row, status: row.status ?? "unknown" }))
    .sort((a, b) => {
      const aRank = STATUS_ORDER[a.status] ?? 99;
      const bRank = STATUS_ORDER[b.status] ?? 99;
      if (aRank !== bRank) return aRank - bRank;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
}
