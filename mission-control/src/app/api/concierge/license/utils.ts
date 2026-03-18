import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUNDLE_BUCKET = process.env.CONCIERGE_BUNDLE_BUCKET || "concierge-bundles";
const TIER2_PATH = process.env.CONCIERGE_TIER2_PATH || "tier2/latest.zip";
const TIER3_PATH = process.env.CONCIERGE_TIER3_PATH || "tier3/latest.zip";
const SIGNED_URL_TTL = Number(process.env.CONCIERGE_BUNDLE_TTL_SECONDS || 3600);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export function generateAccessToken() {
  return randomBytes(24).toString("hex");
}

export async function upsertLicense({
  email,
  tier,
  accessToken,
  stripeCustomerId,
  stripeSubscriptionId,
}: {
  email: string;
  tier: string;
  accessToken: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}) {
  return supabase.from("concierge_licenses").upsert(
    {
      email,
      tier,
      access_token: accessToken,
      status: "active",
      stripe_customer_id: stripeCustomerId || null,
      stripe_subscription_id: stripeSubscriptionId || null,
    },
    { onConflict: "email" }
  );
}

function bundlePathForTier(tier: string) {
  if (tier?.toLowerCase() === "tier3") return TIER3_PATH;
  return TIER2_PATH;
}

export async function createSignedDownload(tier: string) {
  const path = bundlePathForTier(tier);
  const { data, error } = await supabase.storage
    .from(BUNDLE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "Failed to create signed URL");
  }

  return data.signedUrl;
}

export async function lookupLicense(accessToken: string) {
  return supabase
    .from("concierge_licenses")
    .select("id,email,tier,status")
    .eq("access_token", accessToken)
    .eq("status", "active")
    .maybeSingle();
}
