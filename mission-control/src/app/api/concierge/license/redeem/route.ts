import Stripe from "stripe";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { Pool } from "pg";

const pool = process.env.SUPABASE_DB_URL
  ? new Pool({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } })
  : null;

const STRIPE_TEST_SECRET_KEY = process.env.STRIPE_TEST_SECRET_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_TEST_WEBHOOK_SECRET = process.env.STRIPE_TEST_WEBHOOK_SECRET;

async function runQuery(sql: string, params: unknown[]) {
  if (!pool) {
    throw new Error("Database pool is not initialised");
  }
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

function getStripe(live: boolean) {
  const key = live ? STRIPE_SECRET_KEY : STRIPE_TEST_SECRET_KEY;
  if (!key) {
    throw new Error("Missing Stripe secret key");
  }
  return new Stripe(key, { apiVersion: "2023-10-16" });
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
    }

    const body = await request.text();
    const liveMode = request.headers.get("stripe-live-mode") === "true";
    const stripe = getStripe(liveMode);
    const secret = liveMode ? STRIPE_WEBHOOK_SECRET : STRIPE_TEST_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error("Missing Stripe webhook secret");
    }

    const event = stripe.webhooks.constructEvent(body, signature, secret);
    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ ok: true, ignored: event.type });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email || session.customer_email;
    const tier = session.metadata?.tier || session.metadata?.product || "unknown";
    const accessToken = randomBytes(24).toString("hex");

    await runQuery(
      `insert into concierge_licenses (email, tier, access_token, status)
       values ($1,$2,$3,'active')
       on conflict (email) do update set tier = excluded.tier, access_token = excluded.access_token, status = 'active'`,
      [email, tier, accessToken]
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Stripe webhook error", err);
    return NextResponse.json({ error: err.message || "Stripe webhook failure" }, { status: 500 });
  }
}
