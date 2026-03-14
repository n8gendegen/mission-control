import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = process.env.SUPABASE_DB_URL
  ? new Pool({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } })
  : null;

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const DAILY_MESSAGE_LIMIT = Number(process.env.CONCIERGE_CHAT_DAILY_LIMIT || 40);

const SYSTEM_PROMPT = `You are the Mission Control Concierge install guide.
You ONLY answer questions about:
- Installing OpenClaw + Mission Control
- Connecting Supabase, Vercel, Stripe, GitHub secrets
- Using Mission Control modules that ship in the concierge package
If a user asks about anything else (other AI tools, personal decisions, non-mission-control topics) you must politely decline and remind them the chat is scoped to the concierge install.`;

function startOfUtcDayISO() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function sanitizeMessage(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.slice(0, 2000);
}

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

export async function POST(request: Request) {
  if (!pool) {
    return NextResponse.json({ error: "SUPABASE_DB_URL is not configured." }, { status: 500 });
  }
  if (!DEEPSEEK_API_KEY) {
    return NextResponse.json({ error: "DEEPSEEK_API_KEY is not configured." }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer", "").trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Missing concierge license token." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const userMessage = sanitizeMessage(payload.message);
  if (!userMessage) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  // fetch active license for token
  const licenseRes = await runQuery(
    `select id, tier from concierge_licenses where access_token = $1 and status = 'active'`,
    [token]
  );
  if (!licenseRes.rowCount) {
    return NextResponse.json({ error: "Invalid or inactive concierge token." }, { status: 401 });
  }
  const license = licenseRes.rows[0];

  // enforce per-day quota
  const dailyCountRes = await runQuery(
    `select count(*)::int as count from concierge_chat_messages where license_id = $1 and created_at >= $2` ,
    [license.id, startOfUtcDayISO()]
  );
  const todayCount = dailyCountRes.rows[0]?.count ?? 0;
  if (todayCount >= DAILY_MESSAGE_LIMIT) {
    return NextResponse.json({ error: "Daily concierge chat limit reached." }, { status: 429 });
  }

  // ensure session exists / belongs to license
  let sessionId = payload.sessionId as string | undefined;
  if (sessionId) {
    const sessionCheck = await runQuery(
      `select id from concierge_chat_sessions where id = $1 and license_id = $2`,
      [sessionId, license.id]
    );
    if (!sessionCheck.rowCount) {
      return NextResponse.json({ error: "Session not found for this license." }, { status: 403 });
    }
  } else {
    const sessionInsert = await runQuery(
      `insert into concierge_chat_sessions (license_id) values ($1) returning id`,
      [license.id]
    );
    sessionId = sessionInsert.rows[0].id;
  }

  // pull last few messages for context
  const historyRes = await runQuery(
    `select role, content from concierge_chat_messages where session_id = $1 order by created_at desc limit 8`,
    [sessionId]
  );
  const history = historyRes.rows.reverse().map((row) => ({ role: row.role, content: row.content }));

  const llmMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((msg) => ({ role: msg.role === "assistant" ? "assistant" : "user", content: msg.content })),
    { role: "user", content: userMessage }
  ];

  const deepseekResponse = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: llmMessages,
      temperature: 0.1,
      max_tokens: 600,
      stream: false
    })
  });

  if (!deepseekResponse.ok) {
    const details = await deepseekResponse.json().catch(() => null);
    return NextResponse.json(
      { error: details?.error?.message || "DeepSeek request failed." },
      { status: 502 }
    );
  }

  const completion = await deepseekResponse.json();
  const reply = completion?.choices?.[0]?.message?.content?.trim() ||
    "I can only answer questions about your concierge install. Please try again with a Mission Control question.";
  const usage = completion?.usage ?? {};

  await Promise.all([
    runQuery(
      `insert into concierge_chat_messages (session_id, license_id, role, content) values ($1,$2,'user',$3)`,
      [sessionId, license.id, userMessage]
    ),
    runQuery(
      `insert into concierge_chat_messages (session_id, license_id, role, content, token_count) values ($1,$2,'assistant',$3,$4)` ,
      [sessionId, license.id, reply, usage?.completion_tokens || 0]
    ),
    runQuery(`update concierge_chat_sessions set last_interaction_at = timezone('utc', now()) where id = $1`, [sessionId])
  ]);

  return NextResponse.json({
    sessionId,
    reply,
    usage: {
      promptTokens: usage?.prompt_tokens ?? null,
      completionTokens: usage?.completion_tokens ?? null,
      totalTokens: usage?.total_tokens ?? null
    }
  });
}
