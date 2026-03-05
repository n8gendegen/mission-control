import { NextResponse } from "next/server";
import type { ApprovalStatus } from "../../../../lib/data/types";
import { getSupabaseAdminClient } from "../../../../lib/supabase/admin";

const allowedStatuses: ApprovalStatus[] = ["pending", "approved", "rejected"];

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const rowId: string | undefined = body?.rowId;
    const status: ApprovalStatus | undefined = body?.status;

    if (!rowId || !status) {
      return NextResponse.json({ error: "rowId and status are required" }, { status: 400 });
    }

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client not configured" }, { status: 500 });
    }

    const { error } = await supabaseAdmin
      .from("approvals")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", rowId);

    if (error) {
      console.error("Failed to update approval", error.message ?? error);
      return NextResponse.json({ error: "Failed to update approval" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unexpected error updating approval status", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
