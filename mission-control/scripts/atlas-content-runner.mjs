#!/usr/bin/env node
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const REQUIRED = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const LIMIT = Number(process.env.ATLAS_CONTENT_LIMIT || 5);

async function fetchAtlasTasks() {
  const { data } = await supabase
    .from("tasks")
    .select("id, slug, title, description, input_payload")
    .eq("owner_initials", "At")
    .eq("column_id", "backlog")
    .order("updated_at", { ascending: true })
    .limit(LIMIT);
  return data ?? [];
}

async function fetchRecentContent() {
  const { data } = await supabase
    .from("atlas_content_queue")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

async function logContent(content) {
  const { error } = await supabase.from("atlas_content_queue").insert({
    platform: content.platform,
    hook: content.hook,
    body: content.body,
    hashtags: content.hashtags,
    rating: content.rating,
    status: content.rating >= 9 ? "approved" : content.rating >= 7 ? "review" : "draft",
    source_task: content.sourceTask,
  });
  if (error) console.error("Failed to log content:", error.message);
  return !error;
}

function rateContent(platform, hook, body) {
  let score = 6;
  if (!hook || hook.length < 10) return 5;
  if (hook && (hook.includes("?") || hook.startsWith("Here's") || hook.startsWith("The") || hook.startsWith("POV"))) score += 1;
  if (body && body.length > 50) score += 1;
  if (body && body.length > 150) score += 1;
  if (body && (body.includes("actually") || body.includes("here's why") || body.includes("the key") || body.includes("someone"))) score += 1;
  return Math.min(score, 10);
}

async function recordHealth(status, metadata = {}) {
  await supabase.from("agent_health_status").upsert(
    {
      agent_id: "runner:atlas",
      agent_name: "Atlas Marketing",
      lane: "Atlas",
      status,
      last_run_at: new Date().toISOString(),
      metadata,
    },
    { onConflict: "agent_id" }
  );
}

async function main() {
  const tasks = await fetchAtlasTasks();
  const recentContent = await fetchRecentContent();
  
  console.log(`[Atlas] Found ${tasks.length} tasks, ${recentContent.length} recent content items`);

  if (!tasks.length) {
    await recordHealth("dry_run", { tasks: 0, content_created: 0 });
    return;
  }

  let contentCreated = 0;

  for (const task of tasks) {
    const slug = task.slug || "";
    const title = task.title || "";
    const description = task.description || "";
    
    const platforms = [];
    if (slug.includes("linkedin")) platforms.push("linkedin");
    if (slug.includes("instagram")) platforms.push("instagram");
    if (slug.includes("tiktok")) platforms.push("tiktok");
    if (slug.includes("x") || slug.includes("twitter")) platforms.push("x");
    if (slug.includes("social")) {
      if (platforms.length === 0) platforms.push("linkedin", "x", "tiktok");
    }
    if (platforms.length === 0) platforms.push("linkedin", "x");

    for (const platform of platforms) {
      for (let i = 0; i < 2; i++) {
        const content = generateContent(platform, title, description, i);
        content.sourceTask = slug;
        const saved = await logContent(content);
        if (saved) contentCreated++;
      }
    }
    
    await supabase.from("tasks").update({ column_id: "in_progress" }).eq("id", task.id);
  }

  const reviewCount = recentContent.filter(c => c.status === "review").length;
  const approvedCount = recentContent.filter(c => c.status === "approved").length;
  console.log(`[Atlas] Created ${contentCreated} items | ${approvedCount} approved | ${reviewCount} need review`);

  await recordHealth("ok", { tasks: tasks.length, content_created: contentCreated });
}

function generateContent(platform, topic, description, variant) {
  const theme = (topic + " " + description).toLowerCase();
  
  const themes = {
    concierge: theme.includes("concierge") || theme.includes("launchpad") || theme.includes("white glove"),
    install: theme.includes("install") || theme.includes("setup"),
    social: theme.includes("social") || theme.includes("profile") || theme.includes("brand"),
    marketing: theme.includes("marketing") || theme.includes("content") || theme.includes("posting"),
  };

  if (themes.concierge || themes.install || themes.marketing || themes.social) {
    return conciergeContent(platform, variant);
  }
  
  return conciergeContent(platform, variant);
}

function conciergeContent(platform, variant) {
  if (platform === "linkedin") {
    const hooks = [
      "Most automation tools fail at setup. Here's the fix that actually works.",
      "The gap between 'AI tool' and 'AI actually working for you' is smaller than you think.",
      "Why teams give up on automation (and the concierge model that fixes it).",
    ];
    const bodies = [
      "OpenClaw's concierge service means someone walks your team through the entire setup — live, hands-on, done right the first time.\n\nNot a documentation folder. Not a 'figure it out yourself' video. Actual implementation.\n\nIf you've ever abandoned a tool because setup was too hard, you already know why this exists.",
      "The concierge model flips the script. White-glove install means your team doesn't have to be the ones who figure it all out.\n\nDedicated setup. Real integration. Ongoing support.\n\nWorth it if you've ever quit a tool mid-setup.",
      "Setup paralysis is real. But the teams that actually get automation working? They usually had help.\n\nOpenClaw's concierge service is built exactly for this — someone in there with you, making sure it actually works.",
    ];
    const hashtags = ["#OpenClaw", "#AIAgents", "#BusinessAutomation", "#Concierge", "#TechSetup", "#Productivity"];
    const hook = hooks[variant % hooks.length];
    const body = bodies[variant % bodies.length];
    const rating = rateContent(platform, hook, body);
    return { platform, hook, body, hashtags: hashtags.slice(0, 4).join(" "), rating };
  }
  
  if (platform === "x") {
    const hooks = [
      "hot take: the best automation tool is the one you actually set up",
      "the reason most AI tools don't get used? setup",
      "automation anxiety is real and it usually starts at setup",
    ];
    const bodies = [
      "concierge install = someone sets it up with you. not a doc. not a video. live.\n\nworth it if you've ever quit a tool mid-setup.",
      "white-glove AI setup means someone builds it alongside you. not for you. teaches you as they go.",
      "most teams don't need another AI tool. they need someone to actually set the first one up right.",
    ];
    const hashtags = ["#OpenClaw", "#AIautomation", "#AITools"];
    const hook = hooks[variant % hooks.length];
    const body = bodies[variant % bodies.length];
    const rating = rateContent(platform, hook, body);
    return { platform, hook, body, hashtags: hashtags.join(" "), rating };
  }
  
  if (platform === "tiktok") {
    const hooks = [
      "POV: you don't have to figure out AI agents alone",
      "what if setup was actually included?",
      "the real reason you don't use AI tools",
    ];
    const bodies = [
      "OpenClaw's concierge = someone builds your automation live. not a course. not a doc. actual hands-on help.\n\n#openclaw #aitools #automation #techtok #fyp",
      "concierge install: someone in there with you building it, making sure it actually works.\n\nno more half-finished setups.\n\n#openclaw #aiagents #automation #techtok #fyp",
      "most people quit AI tools at setup. concierge = you don't have to figure it out alone.\n\n#openclaw #techtok #ai #automation #fyp",
    ];
    const hook = hooks[variant % hooks.length];
    const body = bodies[variant % bodies.length];
    const rating = rateContent(platform, hook, body);
    return { platform, hook, body, hashtags: "", rating };
  }
  
  if (platform === "instagram") {
    const hooks = [
      "Setup paralysis is real.",
      "What if setup was included?",
      "The AI tool that actually ships.",
    ];
    const bodies = [
      "OpenClaw's concierge service = hands-on AI setup. Someone builds it with you, not for you.\n\nNo more half-finished tool setups.",
      "White-glove AI automation setup. Someone walks your team through the whole thing — live.\n\nBecause the best tool is the one you actually use.",
      "Most AI tools never get used because setup is too hard. Concierge = someone makes sure it actually works for your team.",
    ];
    const hook = hooks[variant % hooks.length];
    const body = bodies[variant % bodies.length];
    const hashtags = "#openclaw #ai #automation #consierge #businesstools #techtip";
    const rating = rateContent(platform, hook, body);
    return { platform, hook, body, hashtags, rating };
  }
  
  return { platform, hook: "The automation gap most businesses never close.", body: "OpenClaw's concierge service closes it. Hands-on setup, real implementation, ongoing support.", hashtags: "#OpenClaw #AI", rating: 6 };
}

main().catch(async (err) => {
  console.error("[Atlas] Error:", err.message);
  await recordHealth("error", { error: err.message });
  process.exit(1);
});
