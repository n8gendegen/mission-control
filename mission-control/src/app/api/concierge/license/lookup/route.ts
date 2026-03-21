import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("concierge_licenses")
    .select("access_token, tier, status, email")
    .eq("stripe_checkout_id", sessionId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "License not found" }, { status: 404 });
  }

  return NextResponse.json({
    token: data.access_token,
    tier: data.tier,
    status: data.status,
    email: data.email,
  });
}
