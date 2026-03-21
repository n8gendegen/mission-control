import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_IDS: Record<string, string> = {
  Beginner: process.env.STRIPE_PRICE_TIER1 || "",
  Operator: process.env.STRIPE_PRICE_TIER2 || "",
  Premier: process.env.STRIPE_PRICE_TIER3 || "",
  Subscription: process.env.STRIPE_PRICE_SUB || "",
};

export async function POST(request: NextRequest) {
  const { tier, includeSubscription } = await request.json();
  const priceId = PRICE_IDS[tier as string];

  if (!priceId) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const lineItems = [{ price: priceId, quantity: 1 }];

  if (includeSubscription && PRICE_IDS.Subscription) {
    lineItems.push({ price: PRICE_IDS.Subscription, quantity: 1 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: includeSubscription ? "subscription" : "payment",
    line_items: lineItems,
    success_url: `${request.nextUrl.origin}/concierge?success=true&tier=${tier}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${request.nextUrl.origin}/concierge?canceled=true`,
  });

  return NextResponse.json({ url: session.url });
}
