"use client";

import Image from "next/image";
import { useState } from "react";

const models = [
  { label: "GPT", vendor: "OpenAI", latency: "520ms", icon: "/assets/models/openai.svg" },
  { label: "Claude", vendor: "Anthropic", latency: "610ms", icon: "/assets/models/claude.svg" },
  { label: "Gemini", vendor: "Google", latency: "430ms", icon: "/assets/models/gemini.svg" },
  { label: "DeepSeek", vendor: "DeepSeek", latency: "340ms", icon: "/assets/models/deepseek.svg" },
  { label: "Qwen", vendor: "Alibaba", latency: "890ms", icon: "/assets/models/qwen.svg" },
];

const roiRows = [
  { label: "Hours/week currently spent on tasks agents will handle", value: "12–15 hrs" },
  { label: "Founder’s effective hourly rate ($10K/mo ÷ 160 hrs)", value: "~$62/hr" },
  { label: "Weekly value of recovered time", value: "$750–$940" },
  { label: "Monthly value of recovered time", value: "$3,000–$3,750" },
  { label: "LaunchPad investment (one-time)", value: "$399" },
  { label: "Payback period", value: "Under 1 week" },
  { label: "12-month ROI", value: "90–113x return" },
];

const benefits = [
  "Hands-on install with zero guesswork",
  "Battle-tested automation rules so your agents work 24/7",
  "Mission Control deployed with starter data so tasks ship immediately",
  "Multi-agent model so parallel workstreams stay unblocked",
  "Bounty and YouTube swimlanes deliver revenue from day one",
  "Security and compliance baked into the control framework",
];

const installSteps = [
  {
    title: "Checkout",
    body: "Stripe-enabled purchase of your preferred pricing tier unlocks the chat-guided install experience.",
  },
  {
    title: "Install & Validation",
    body: "We prep the machine, run the Clawbot/OpenClaw scripts, and validate heartbeat + status automations.",
  },
  {
    title: "Mission Control (Operator/Premier)",
    body: "Deploy Mission Control to Vercel/Supabase, wire the Launchpad funnel, and seed Operator/Premier tasks.",
  },
  {
    title: "Handoff & Coaching",
    body: "Robust documentation for your OpenClaw agent plus 7 days of chatbot support for follow-up questions.",
  },
];

const packages = [
  {
    tier: "Beginner",
    badge: "Launchpad install",
    price: "$49",
    features: ["One-time OpenClaw install on your desktop", "Targeted chatbot guide with paste-ready commands"],
    accent: "border-white/10 bg-white/5",
    primary: true,
  },
  {
    tier: "Operator",
    badge: "Automation bundle",
    price: "$299",
    features: [
      "Everything in Beginner",
      "Mission Control task automation",
      "Mission Control data spend analysis",
      "Cron jobs + sub-agent structure",
    ],
    accent: "border-violet-500/40 bg-violet-500/10",
  },
  {
    tier: "Premier",
    badge: "Revenue + operator",
    price: "$399",
    features: [
      "Everything in Operator",
      "Mission Control Bounty Hunter module",
      "Mission Control YouTube content creation conveyor",
      "Full GitHub repo + Vercel connections",
    ],
    accent: "border-amber-500/40 bg-amber-500/10",
  },
];

const screenshotCards = [
  { label: "Tasks", copy: "Live pipeline + agent status at a glance.", image: "/images/mission-control/tasks.png" },
  { label: "Data", copy: "Spend tracking, usage trends, and guardrails.", image: "/images/mission-control/data.png" },
  { label: "Content Lab", copy: "YouTube/content conveyor with ready-to-ship assets.", image: "/images/mission-control/content.png" },
  { label: "Bounty", copy: "Revenue plays + bounty queue awaiting activation.", image: "/images/mission-control/bounty.png" },
  { label: "Calendar", copy: "Cron jobs, concierge installs, and follow-ups.", image: "/images/mission-control/calendar.png" },
];

const bundleCards = [
  {
    tier: 2,
    title: "Operator bundle ZIP",
    copy: "Mission Control starter data, cron helpers, concierge CTA wiring, and Revenue Lab backlog.",
    storagePath: "concierge-bundles/tier2/latest.zip",
  },
  {
    tier: 3,
    title: "Premier bundle ZIP",
    copy: "Adds bounty + YouTube automations, repo wiring, and white-glove playbooks for operators.",
    storagePath: "concierge-bundles/tier3/latest.zip",
  },
];

const tracker = [
  {
    title: "Beginner install",
    status: "Now",
    headline: "OpenClaw ready",
    copy: "Chatbot-guided desktop install finished with your Launchpad token synced.",
    progress: 75,
  },
  {
    title: "Operator automation",
    status: "Next",
    headline: "Mission Control wired",
    copy: "Automation, spend analytics, and cron/sub-agent scaffolding activated.",
    progress: 50,
  },
  {
    title: "Premier deploy",
    status: "Queue",
    headline: "Repo + Vercel handoff",
    copy: "Full GitHub repo, Vercel connections, and bounty/youtube modules staged.",
    progress: 25,
  },
  {
    title: "White glove",
    status: "Recurring",
    headline: "Weekly enhancements",
    copy: "Newsletter + repo improvement pushes continuously enhance Mission Control.",
    progress: 10,
  },
];

const faqs = [
  "What does Launchpad actually install?",
  "How fast can we go live?",
  "Do you need access to our secrets?",
  "What if we already started the install?",
  "Does this include ongoing maintenance?",
];

async function handleCheckout(tier: string, includeSubscription = false) {
  const res = await fetch("/api/concierge/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tier, includeSubscription }),
  });
  const { url } = await res.json();
  if (url) window.location.href = url;
}

export default function ConciergePage() {
  const [token, setToken] = useState("");
  const [redeemState, setRedeemState] = useState({ status: "idle", tier: null, downloadUrl: "", error: "" });
  async function redeemToken() {
    if (!token.trim()) {
      setRedeemState({ status: "error", tier: null, downloadUrl: "", error: "Enter your Launchpad token" });
      return;
    }
    try {
      setRedeemState({ status: "loading", tier: null, downloadUrl: "", error: "" });
      const resp = await fetch("/api/concierge/license/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() })
      });
      const payload = await resp.json();
      if (!resp.ok) {
        throw new Error(payload?.error || "Redeem failed");
      }
      setRedeemState({ status: "success", tier: Number(payload.tier), downloadUrl: payload.downloadUrl, error: "" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Redeem failed";
      setRedeemState({ status: "error", tier: null, downloadUrl: "", error: message });
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12">
      <div className="mx-auto max-w-6xl px-6 space-y-16">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#120F1E] via-[#0C0F1C] to-[#05070D] p-10 shadow-[0_25px_70px_-35px_rgba(96,76,255,0.6)]">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
            <div className="flex flex-1 flex-col gap-6">
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.4em] text-white/60">
                <span className="text-violet-300">Launchpad</span>
                <span className="h-px w-10 bg-white/20" />
                <span>White-glove install</span>
              </div>
              <h1 className="text-4xl font-semibold text-white sm:text-5xl">
                Launch OpenClaw + Mission Control in minutes, not weeks.
              </h1>
              <p className="max-w-2xl text-base text-white/70">
                We prep your machine and guide you through the entire process via a personalized live chatbot, wire the heartbeat automations so tasks complete autonomously, deploy Mission Control so operators have full line of sight, and hand you a revenue-ready suite that lowers operating cost. You just show up and run the playbook.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <button className="rounded-full bg-violet-500 px-6 py-3 text-center text-sm font-semibold text-white shadow shadow-violet-500/50">
                  Launch Premier install
                </button>
                <a className="rounded-full border border-white/20 px-6 py-3 text-center text-sm text-white/80" href="#launchpad-tracker">
                  See install experience ↴
                </a>
              </div>
            </div>
            <div className="flex flex-1 justify-end">
              <div className="relative isolate w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="absolute -left-6 top-6 h-24 w-24 rounded-full bg-violet-500/30 blur-3xl" />
                <div className="absolute -bottom-6 right-0 h-24 w-24 rounded-full bg-fuchsia-500/30 blur-3xl" />
                <div className="relative flex items-center gap-4">
                  <Image
                    alt="OpenClaw mark"
                    width={88}
                    height={88}
                    className="drop-shadow-[0_20px_40px_rgba(255,90,95,0.35)]"
                    src="/assets/brand/openclaw.svg"
                  />
                  <div>
                    <p className="text-sm uppercase tracking-[0.4em] text-white/50">OpenClaw Launchpad</p>
                    <p className="text-2xl font-semibold text-white">Launchpad install steps</p>
                    <p className="text-sm text-white/70">Avg deploy time • 25 minutes</p>
                  </div>
                </div>
                <div className="mt-6 space-y-3 text-sm text-white/70">
                  <div className="flex items-center justify-between">
                    <p>Beginner install</p>
                    <p className="font-mono text-white">complete</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p>Operator automation</p>
                    <p className="font-mono text-amber-300">in progress</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p>Premier deploy</p>
                    <p className="font-mono text-fuchsia-300">up next</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p>White Glove Improvements</p>
                    <p className="font-mono text-sky-300">shipping weekly</p>
                  </div>
                </div>
                <div className="mt-6 rounded-2xl border border-white/15 bg-black/30 p-4 text-xs text-white/60">
                  <p className="font-semibold text-white">Live installation chat help</p>
                  <p className="mt-1 text-white/70">
                    “You’re on macOS—press ⌘ + Space, type ‘Terminal,’ hit return, and I’ll paste the install script for you.”
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Model spine */}
        <section className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs uppercase tracking-[0.4em] text-white/40">
            <span>Agents ride on</span>
            <div className="hidden h-px flex-1 bg-white/10 sm:block" />
            <span className="text-white/60">Multi-model spine</span>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-5">
            {models.map((model) => (
              <div key={model.label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#080D15] p-3">
                <Image alt={model.label} width={36} height={36} src={model.icon} />
                <div>
                  <p className="text-sm font-semibold text-white">{model.label}</p>
                  <p className="text-xs text-white/50">{model.vendor}</p>
                </div>
                <span className="ml-auto rounded-full bg-white/10 px-3 py-1 text-xs font-mono text-white/70">{model.latency}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ROI + install experience */}
        <section className="grid gap-6 rounded-3xl border border-white/5 bg-[#0b0f16] p-8 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">ROI justification</p>
            <p className="mt-2 text-sm text-white/70">Conservative scenario for a founder doing $10K/mo.</p>
            <div className="mt-5 divide-y divide-white/10 border-t border-b border-white/10 text-sm text-white/70">
              {roiRows.map((row) => (
                <div key={row.label} className="flex flex-col gap-1 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40">{row.label}</p>
                  <p className="text-base font-semibold text-white">{row.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-white">Why teams choose us</h2>
              <ul className="mt-6 space-y-3 text-white/70">
                {benefits.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-violet-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">Launchpad Installation Experience</h2>
              <ol className="mt-6 space-y-4 text-white/70">
                {installSteps.map((step) => (
                  <li key={step.title}>
                    <p className="font-semibold text-white">{step.title}</p>
                    <p className="text-sm text-white/60">{step.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Packages */}
        <section id="packages" className="rounded-3xl border border-white/5 bg-[#0b0f16] p-8">
          <h2 className="text-2xl font-semibold text-white">Launchpad packages</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {packages.map((pkg) => (
              <div key={pkg.tier} className={`rounded-2xl border ${pkg.accent} p-6`}>
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">{pkg.tier}</p>
                <h3 className="mt-3 text-xl font-semibold text-white">{pkg.badge}</h3>
                <p className="mt-2 text-3xl font-bold text-white">{pkg.price}</p>
                <ul className="mt-4 space-y-2 text-sm text-white/70">
                  {pkg.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <div className="mt-4 space-y-3">
                  <button onClick={() => handleCheckout(pkg.tier)} className="w-full rounded-full border border-white/20 px-4 py-3 text-sm font-semibold text-white">
                    Get {pkg.tier} package
                  </button>
                  {pkg.tier !== "Beginner" && (
                    <button onClick={() => handleCheckout(pkg.tier, true)} className="w-full rounded-full border border-emerald-400/50 px-4 py-3 text-sm font-semibold text-emerald-200">
                      {pkg.tier} + subscription
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Monthly add-on</p>
            <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">White glove subscription</h3>
                <p className="text-sm text-white/70">Weekly Newsletter + repo enhancements that push new Mission Control features.</p>
              </div>
              <p className="text-2xl font-bold text-white">$69 / mo</p>
            </div>
          </div>
        </section>

        {/* Screenshot gallery */}
        <section className="rounded-3xl border border-white/5 bg-[#0b0f16] p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/40">Mission Control</p>
              <h2 className="text-2xl font-semibold text-white">What operators see day-to-day</h2>
              <p className="text-sm text-white/70">Screenshots from the live dashboard so buyers can peek at the Tasks, Data, Content Lab, Bounty, and Calendar views.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {screenshotCards.map((card) => (
              <figure key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">
                <div className="overflow-hidden rounded-xl border border_white/5">
                  <Image alt={`${card.label} screenshot`} width={900} height={540} className="h-auto w-full object-cover" src={card.image} />
                </div>
                <figcaption className="mt-3">
                  <p className="text-sm font-semibold text-white">{card.label}</p>
                  <p className="text-xs text-white/60">{card.copy}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Tracker */}
        <section id="launchpad-tracker" className="rounded-[32px] border border-white/10 bg-[#05070D] p-8">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/40">Launchpad tracker</p>
              <h2 className="text-2xl font-semibold text-white">Where your Launchpad install is right now</h2>
            </div>
            <div className="text-xs text-white/40">Syncing live data…</div>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-4">
            {tracker.map((card) => (
              <article key={card.title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify_between text-xs uppercase tracking-[0.4em] text-white/40">
                  <span>{card.title}</span>
                  <span className="text-white/60">ETA {card.status}</span>
                </div>
                <p className="mt-4 text-lg font-semibold text_white">{card.headline}</p>
                <p className="mt-2 text-sm text-white/70">{card.copy}</p>
                <div className="mt-6">
                  <div className="h-2 w-full rounded-full bg_white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400" style={{ width: `${card.progress}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-white/50">{card.progress}% complete</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="rounded-3xl border border-white/5 bg-[#0b0f16] p-8">
          <h2 className="text-2xl font-semibold text-white">Frequently asked questions</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {faqs.map((question) => (
              <div key={question} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold text-white">{question}</p>
                <p className="mt-2 text-sm text-white/70">
                  We configure OpenClaw/Clawbot, set up heartbeat + status automations, and (Operator/Premier) deploy Mission Control with starter data.
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Install chat (ZIP bundle block will sit below this next) */}
        <section id="launchpad-chat" className="rounded-3xl border border-white/5 bg-[#0b0f16] p-8">
          <div className="mb-6 space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-violet-300">Install chat</p>
            <h2 className="text-2xl font-semibold text-white">Personal Launchpad Guide</h2>
            <p className="text-sm text-white/70">
              Post checkout, customers automatically receive a token that activates a 7-day trial where they can ask anything about their OpenClaw/Mission Control install and get real-time guidance.
            </p>
          </div>
          <div className="space-y-8 rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-2xl font-semibold">Launchpad install chat</h3>
              </div>
              <p className="text-sm text-white/70">
                This DeepSeek-powered guide only answers questions about installing OpenClaw + Mission Control. After checkout we auto-import your token & JWT so you can jump straight into the conversation.
              </p>
            </div>
            <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); redeemToken(); }}>
              <label className="text-sm uppercase tracking-wide text-white/40">Launchpad token</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white"
                  placeholder="paste your Launchpad token"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                />
                <button
                  className="rounded-2xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  type="submit"
                  disabled={redeemState.status === "loading"}
                >
                  {redeemState.status === "loading" ? "Checking…" : "Redeem"}
                </button>
              </div>
            </form>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
              {redeemState.status === "success" && redeemState.downloadUrl ? (
                <span className="text-emerald-300">Unlocked Tier {redeemState.tier} • <a className="underline" href={redeemState.downloadUrl}>Download bundle</a></span>
              ) : redeemState.status === "error" ? (
                <span className="text-rose-300">{redeemState.error}</span>
              ) : (
                <span>Paste a valid Launchpad token above to unlock the chat + bundles.</span>
              )}
            </div>
          </div>
        </section>
        <section className="rounded-3xl border border-white/5 bg-[#0b0f16] p-8">
          <h2 className="text-2xl font-semibold text-white">Downloadable bundle artifacts</h2>
          <p className="mt-2 text-sm text-white/70">Redeem your Launchpad token to unlock signed ZIPs for the Operator (Tier 2) and Premier (Tier 3) bundles.</p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {bundleCards.map((card) => {
              const unlocked = redeemState.status === "success" && Number(redeemState.tier) >= card.tier;
              return (
                <article key={card.tier} className={`rounded-2xl border ${unlocked ? "border-emerald-400/60 bg-emerald-400/5" : "border-white/10 bg-white/5"} p-6`}>
                  <p className="text-xs uppercase tracking-[0.4em] text-white/50">Tier {card.tier}</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{card.title}</h3>
                  <p className="mt-2 text-sm text-white/70">{card.copy}</p>
                  <p className="mt-4 text-xs text-white/50">Supabase bucket: {card.storagePath}</p>
                  <p className="text-xs text-white/50">Redeem endpoint: /api/concierge/license/redeem</p>
                  <div className="mt-4">
                    {unlocked ? (
                      <a className="inline-flex items-center gap-2 rounded-full bg-emerald-500/80 px-4 py-2 text-sm font-semibold text-white" href={redeemState.downloadUrl}>
                        Download ZIP ↗
                      </a>
                    ) : (
                      <span className="text-xs uppercase tracking-[0.3em] text-white/40">Locked</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
