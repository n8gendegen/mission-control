import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") || "new";
  const source = searchParams.get("source") || "all";
  const limit = Number(searchParams.get("limit") || "50");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = supabase
    .from("spy_opportunities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  if (source !== "all") {
    query = query.eq("source", source);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also get summary stats
  const { count: totalCount } = await supabase
    .from("spy_opportunities")
    .select("*", { count: "exact", head: true });

  const { count: newCount } = await supabase
    .from("spy_opportunities")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");

  const { count: approvedCount } = await supabase
    .from("spy_opportunities")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  return NextResponse.json({
    opportunities: data,
    stats: {
      total: totalCount,
      new: newCount,
      approved: approvedCount,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, status, claim_status, claim_comment_url } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const updates: Record<string, string> = {};
  if (status) updates.status = status;
  if (claim_status) updates.claim_status = claim_status;
  if (claim_comment_url) updates.claim_comment_url = claim_comment_url;

  const { data, error } = await supabase
    .from("spy_opportunities")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
