import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const allowedActions = new Set(["ack", "snooze", "complete"]);

export async function POST(request: Request) {
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Supabase credentials are missing" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { entityType, entityId, action, actor = "Nate", metadata } = body;

  if (!entityType || !entityId || !action) {
    return NextResponse.json({ error: "entityType, entityId, and action are required" }, { status: 400 });
  }

  if (!allowedActions.has(action)) {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { error } = await supabase.from("action_log").insert({
    entity_type: entityType,
    entity_id: entityId,
    action,
    actor,
    metadata: metadata ?? {},
  });

  if (error) {
    console.error("Failed to insert action", error);
    return NextResponse.json({ error: "Failed to record action" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
