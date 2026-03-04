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
  const response = await fetch("/api/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entityType, entityId, action, metadata }),
  });

  if (!response.ok) {
    throw new Error(`Failed to log action: ${response.status}`);
  }

  return response.json();
}
