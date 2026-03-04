import { getSupabaseClient } from "../supabase/client";

export type LoggableAction = "ack" | "snooze" | "complete";

export async function logAction({
  entityType,
  entityId,
  action,
  metadata,
}: {
  entityType: string;
  entityId: string;
  action: LoggableAction;
  metadata?: Record<string, unknown>;
}) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Supabase client is not configured");
  }

  const { error } = await client.from("action_log").insert({
    entity_type: entityType,
    entity_id: entityId,
    action,
    actor: "Nate",
    metadata: metadata ?? {},
  });

  if (error) {
    throw new Error(error.message);
  }
}
