import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_IDS: Record<string, string> = {
  Beginner: process.env.STRIPE_PRICE_TIER1 || "",
  Operator: process.env.STRIPE_PRICE_TIER2 || "",
  Premier: process.env.STRIPE_PRICE_TIER3 || "",
};

export async function POST(request: NextRequest) {
  const { tier } = await request.json();

  const priceId = PRICE_IDS[tier as string];
  if (!priceId) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${request.nextUrl.origin}/concierge?success=true&tier=${tier}`,
    cancel_url: `${request.nextUrl.origin}/concierge?canceled=true`,
  });

  return NextResponse.json({ url: session.url });
}
