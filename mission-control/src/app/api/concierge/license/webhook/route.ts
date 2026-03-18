import { NextResponse } from "next/server";
import Stripe from "stripe";
import { generateAccessToken, upsertLicense } from "../../license/utils";

const testWebhookSecret = process.env.STRIPE_TEST_WEBHOOK_SECRET;
const liveWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const liveSecretKey = process.env.STRIPE_SECRET_KEY;
const testSecretKey = process.env.STRIPE_TEST_SECRET_KEY;

function getStripeClient() {
  const secret = liveSecretKey || testSecretKey;
  if (!secret) {
    throw new Error("Missing STRIPE_SECRET_KEY or STRIPE_TEST_SECRET_KEY");
  }
  return new Stripe(secret, { apiVersion: "2026-02-25.clover" });
}

function constructEvent(rawBody: string, signature: string | null) {
  const stripe = getStripeClient();
  if (!signature) {
    throw new Error("Missing stripe-signature header");
  }
  if (!testWebhookSecret || !liveWebhookSecret) {
    throw new Error("Missing Stripe webhook secrets");
  }
  try {
    return stripe.webhooks.constructEvent(rawBody, signature, liveWebhookSecret);
  } catch (liveErr) {
    return stripe.webhooks.constructEvent(rawBody, signature, testWebhookSecret);
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");
    const event = constructEvent(rawBody, signature);

    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ ok: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email ?? session.customer_email;
    const tier = session.metadata?.tier || session.metadata?.product || "tier2";

    if (!email) {
      throw new Error("Missing customer email on checkout.session");
    }

    const accessToken = generateAccessToken();
    const { error } = await upsertLicense({
      email,
      tier,
      accessToken,
      stripeCustomerId: (session.customer as string) || null,
      stripeSubscriptionId: (session.subscription as string) || null,
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe webhook error";
    console.error("Stripe webhook failed", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
