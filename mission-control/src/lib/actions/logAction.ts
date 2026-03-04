import { getSupabaseClient } from "../supabase/client";

export type LoggableAction = "ack" | "snooze" | "complete";

const EVENT_TYPE_MAP: Record<string, Record<LoggableAction, string>> = {
  alert: {
    ack: "alert_acknowledged",
    snooze: "alert_snoozed",
    complete: "alert_completed",
  },
  agent_work_session: {
    ack: "agent_work_acknowledged",
    snooze: "agent_work_snoozed",
    complete: "agent_work_completed",
  },
};

const ACTION_VERB: Record<LoggableAction, string> = {
  ack: "acknowledged",
  snooze: "snoozed",
  complete: "completed",
};

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

  const payload = {
    entity_type: entityType,
    entity_id: entityId,
    action,
    actor: "Nate",
    metadata: metadata ?? {},
  };

  const { error } = await client.from("action_log").insert(payload);

  if (error) {
    throw new Error(error.message);
  }

  const eventType = EVENT_TYPE_MAP[entityType]?.[action] ?? `${entityType}_${action}`;
  const label = (metadata?.label as string | undefined) ?? entityId;
  const summary = `Nate ${ACTION_VERB[action]} ${label}`;

  const { error: activityError } = await client.from("activity_log").insert({
    event_type: eventType,
    source: "ui-action",
    actor: "Nate",
    summary,
    entity_type: entityType,
    entity_id: entityId,
    metadata: { action, ...(metadata ?? {}) },
  });

  if (activityError) {
    console.error("Failed to write activity log entry", activityError);
  }
}
