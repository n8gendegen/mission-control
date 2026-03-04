import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from "../supabase/client";

export type ActivityLogEntry = {
  id: string;
  event_type: string;
  source: string | null;
  actor: string;
  summary: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export async function fetchRecentActivity(limit = 25): Promise<ActivityLogEntry[]> {
  const client = getSupabaseClient();
  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("activity_log")
    .select("id,event_type,source,actor,summary,entity_type,entity_id,metadata,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch activity_log entries", error.message ?? error);
    return [];
  }

  return (data as ActivityLogEntry[]) ?? [];
}

export function subscribeToActivity(onInsert: (entry: ActivityLogEntry) => void) {
  const client = getSupabaseClient();
  if (!client) {
    return { unsubscribe: () => {} };
  }

  const channel: RealtimeChannel = client
    .channel("activity-log")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "activity_log" },
      (payload) => {
        onInsert(payload.new as ActivityLogEntry);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      client.removeChannel(channel);
    },
  };
}
