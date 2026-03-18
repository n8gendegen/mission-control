import { NextResponse } from "next/server";
import { createSignedDownload, lookupLicense } from "../../license/utils";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const token = payload?.token?.toString().trim();
    if (!token) {
      return NextResponse.json({ error: "Missing concierge token" }, { status: 400 });
    }

    const { data, error } = await lookupLicense(token);
    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      return NextResponse.json({ error: "Invalid or inactive concierge token" }, { status: 401 });
    }

    const signedUrl = await createSignedDownload(data.tier);
    return NextResponse.json({ downloadUrl: signedUrl, tier: data.tier });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Redeem failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
