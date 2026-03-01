import { NextResponse } from "next/server";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE = process.env.AIRTABLE_CONCIERGE_TABLE || "Concierge Leads";

export async function POST(request: Request) {
  const payload = await request.json();

  const record = {
    fields: {
      Name: payload.name || "",
      Email: payload.email || "",
      Company: payload.company || "",
      Tier: payload.tier || "",
      Notes: payload.notes || "",
      Source: "concierge-site"
    }
  };

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json(
      { error: "Airtable credentials missing; set AIRTABLE_API_KEY and AIRTABLE_BASE_ID." },
      { status: 500 }
    );
  }

  const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`;

  const res = await fetch(airtableUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ records: [record] })
  });

  if (!res.ok) {
    const details = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: details?.error?.message || "Unable to save lead to Airtable." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
