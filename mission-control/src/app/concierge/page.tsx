'use client';

import { FormEvent, useMemo, useState } from "react";

const benefits = [
  "Hands-on install with zero guesswork",
  "Secure secrets + battle-tested automations",
  "Mission Control deployed with starter data",
  "Lead funnel + guided install ready day one",
  "Post-install coaching so the team can run solo",
  "Security & compliance handoff checklist for your ops lead"
];

const howItWorks = [
  {
    title: "Discovery",
    body: "30-minute kickoff to understand your environment, security requirements, and priority automations."
  },
  {
    title: "Install & Validation",
    body: "We prep the machine, run the Clawbot/OpenClaw scripts, and validate heartbeat + status automations."
  },
  {
    title: "Mission Control (Tier 2)",
    body: "Deploy Mission Control to Vercel/Supabase, wire the concierge funnel, and seed Revenue Lab tasks."
  },
  {
    title: "Handoff & Coaching",
    body: "Async Loom walkthrough + DM support so you know exactly what shipped and how to extend it."
  }
];

const faq = [
  {
    q: "What does the concierge actually install?",
    a: "We configure OpenClaw/Clawbot, set up heartbeat + status automations, and (Tier 2) deploy Mission Control with starter data."
  },
  {
    q: "How fast can we go live?",
    a: "Tier 1 installs usually ship in 3–5 business days from kickoff; Tier 2 adds ~2 days for Mission Control work."
  },
  {
    q: "Do you need access to our secrets?",
    a: "We work from your vault (1Password/Bitwarden) so secrets never leave your control."
  },
  {
    q: "What if we already started the install?",
    a: "We audit what you have, reuse components, and only bill for the scope that remains."
  },
  {
    q: "Does this include ongoing maintenance?",
    a: "Tier 1 includes 7-day DM support; longer retainers are scoped separately once you are live."
  }
];

const guidedSteps = [
  {
    title: "Pick your OS",
    content:
      "Tell us whether you're on macOS Sonoma/Ventura, Ubuntu 22.04+, or another Linux flavor so we can pull the right script."
  },
  {
    title: "Prep dependencies",
    content:
      "Install Homebrew (mac) or apt packages (Ubuntu), plus Node 20, pnpm, and the OpenClaw CLI with one command."
  },
  {
    title: "Configure Clawbot",
    content:
      "We step through openclaw init, connect your GitHub repo, and drop in the heartbeat + status tasks."
  },
  {
    title: "Deploy Mission Control",
    content:
      "For Tier 2, we link Supabase + Vercel, run the schema migrations, and push the concierge route."
  },
  {
    title: "Escalate if stuck",
    content:
      "Hit the concierge button at any time and we jump on async/Zoom to finish the install for you."
  }
];

export default function ConciergePage() {
  const [formState, setFormState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    tier: "tier1",
    notes: ""
  });
  const [stepIndex, setStepIndex] = useState(0);

  const currentStep = useMemo(() => guidedSteps[stepIndex], [stepIndex]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormState("submitting");
    setMessage("");

    try {
      const res = await fetch("/api/concierge-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({ error: "" }));
        throw new Error(payload.error || "Unable to submit lead right now.");
      }

      setFormState("success");
      setMessage("Thanks! We’ll reply with scheduling options within one business day.");
      setFormData({ name: "", email: "", company: "", tier: "tier1", notes: "" });
    } catch (err) {
      setFormState("error");
      setMessage((err as Error).message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12">
      <div className="mx-auto max-w-6xl px-6 space-y-16">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl shadow-violet-500/20">
          <p className="text-xs uppercase tracking-[0.4em] text-violet-300">Clawbot Concierge</p>
          <h1 className="mt-4 text-4xl font-semibold text-white">Launch OpenClaw + Mission Control in days, not weeks.</h1>
          <p className="mt-4 max-w-3xl text-base text-white/70">
            We install the entire agent stack, deploy Mission Control, wire your concierge funnel, and leave you with
            automations that are audited, documented, and ready to scale.
          </p>
          <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center">
            <a
              href="#lead-form"
              className="rounded-full bg-violet-500 px-6 py-3 text-center text-sm font-semibold text-white shadow shadow-violet-500/50"
            >
              Book the concierge
            </a>
            <button
              className="rounded-full border border-white/20 px-6 py-3 text-sm text-white/80"
              onClick={() => setStepIndex(0)}
            >
              Explore guided install ↴
            </button>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/5 bg-[#0b0f16] p-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold text-white">Why teams book the concierge</h2>
            <ul className="mt-6 space-y-3 text-white/70">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-violet-400" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white">How it works</h2>
            <ol className="mt-6 space-y-4 text-white/70">
              {howItWorks.map((item) => (
                <li key={item.title}>
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="text-sm text-white/60">{item.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="rounded-3xl border border-white/5 bg-[#0b0f16] p-8">
          <h2 className="text-2xl font-semibold text-white">Concierge tiers</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.4em] text-violet-300">Tier 1</p>
              <h3 className="mt-3 text-xl font-semibold text-white">Done-for-you Clawbot install</h3>
              <p className="text-3xl font-bold text-white mt-2">$1,950</p>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                <li>Device audit + dependency prep</li>
                <li>OpenClaw/Clawbot configured with heartbeat + status automations</li>
                <li>Secrets stored via your vault; rollback + validation plan delivered</li>
                <li>7-day DM support after go-live</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-violet-500/40 bg-violet-500/10 p-6">
              <p className="text-xs uppercase tracking-[0.4em] text-violet-300">Tier 2</p>
              <h3 className="mt-3 text-xl font-semibold text-white">Mission Control Starter Pack</h3>
              <p className="text-3xl font-bold text-white mt-2">$4,350</p>
              <ul className="mt-4 space-y-2 text-sm text-white/80">
                <li>Everything in Tier 1</li>
                <li>Mission Control deployed on Vercel + Supabase with starter data</li>
                <li>Concierge landing page + lead capture connected to Airtable</li>
                <li>Revenue Lab backlog seeded + 14-day coaching window</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="guided-flow" className="rounded-3xl border border-white/5 bg-[#0b0f16] p-8">
          <h2 className="text-2xl font-semibold text-white">Guided install (DIY helper)</h2>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-[0.4em] text-white/40">Step {stepIndex + 1} of {guidedSteps.length}</p>
            <h3 className="mt-2 text-xl font-semibold text-white">{currentStep.title}</h3>
            <p className="mt-2 text-white/70">{currentStep.content}</p>
            <div className="mt-4 flex gap-3">
              <button
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 disabled:opacity-30"
                disabled={stepIndex === 0}
                onClick={() => setStepIndex((prev) => Math.max(prev - 1, 0))}
              >
                Back
              </button>
              <button
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-white"
                onClick={() => setStepIndex((prev) => Math.min(prev + 1, guidedSteps.length - 1))}
              >
                Next
              </button>
              <a
                href="#lead-form"
                className="ml-auto rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Escalate to concierge
              </a>
            </div>
          </div>
        </section>

        <section id="lead-form" className="rounded-3xl border border-white/5 bg-[#0b0f16] p-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold text-white">Tell us about your install</h2>
              <p className="mt-2 text-white/70">We reply within one business day with scheduling options and next steps.</p>
              <div className="mt-6 space-y-4 text-sm text-white/70">
                <p>📞 30-min discovery call</p>
                <p>🛠️ Install + Mission Control deployment</p>
                <p>🗂️ Loom walkthrough + docs so you can run solo</p>
              </div>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm text-white/60">Name</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-violet-400 focus:outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-white/60">Email</label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-violet-400 focus:outline-none"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-white/60">Company / Team</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-violet-400 focus:outline-none"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-white/60">Tier interest</label>
                <select
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-violet-400 focus:outline-none"
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                >
                  <option value="tier1">Tier 1 – Clawbot install ($1,950)</option>
                  <option value="tier2">Tier 2 – Add Mission Control ($4,350)</option>
                  <option value="not-sure">Not sure yet</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-white/60">Context / blockers</label>
                <textarea
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-violet-400 focus:outline-none"
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-violet-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                disabled={formState === "submitting"}
              >
                {formState === "submitting" ? "Sending..." : "Submit"}
              </button>
              {message && (
                <p className={`text-sm ${formState === "error" ? "text-rose-300" : "text-emerald-300"}`}>{message}</p>
              )}
            </form>
          </div>
        </section>

        <section className="rounded-3xl border border-white/5 bg-[#0b0f16] p-8">
          <h2 className="text-2xl font-semibold text-white">Frequently asked questions</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {faq.map((item) => (
              <div key={item.q} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold text-white">{item.q}</p>
                <p className="mt-2 text-sm text-white/70">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
