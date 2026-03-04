const { createClient } = require("@supabase/supabase-js");

let serviceClient;

function getServiceClient() {
  if (serviceClient) {
    return serviceClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase environment variables. Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY before logging activity."
    );
  }

  serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return serviceClient;
}

async function logActivity({
  eventType,
  summary,
  actor = "System",
  source = "mission-control",
  entityType = null,
  entityId = null,
  metadata = null,
}) {
  if (!eventType || !summary) {
    throw new Error("logActivity requires eventType and summary");
  }

  const client = getServiceClient();
  const payload = {
    event_type: eventType,
    summary,
    actor,
    source,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata ?? null,
  };

  const { error } = await client.from("activity_log").insert(payload);
  if (error) {
    throw new Error(`Failed to log activity: ${error.message}`);
  }

  return true;
}

module.exports = {
  logActivity,
  default: logActivity,
};
