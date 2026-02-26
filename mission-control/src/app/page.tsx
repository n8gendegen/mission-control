"use client";

import { useState } from "react";

const AGENTS = [
  { id: "henry", name: "Henry", title: "CEO / Orchestrator" },
  { id: "steve", name: "Steve", title: "Senior Coding Agent" },
  { id: "ops", name: "Ops Sentinel", title: "Treasury Ops Monitor" },
];

export default function Home() {
  const [selectedAgent, setSelectedAgent] = useState("henry");
  const current = AGENTS.find((agent) => agent.id === selectedAgent);

  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      <aside className="w-72 border-r border-white/10 bg-black/30 backdrop-blur-xl p-6 flex flex-col">
        <h1 className="text-sm font-semibold tracking-[0.3em] text-white/60">
          MISSION CONTROL
        </h1>
        <nav className="mt-6 space-y-2">
          <button className="w-full rounded-xl bg-white/10 px-4 py-3 text-left font-semibold text-white shadow-inner shadow-black/40">
            💬 Chat
          </button>
          <button className="w-full rounded-xl px-4 py-3 text-left text-white/70">
            💹 Revenue Labs
          </button>
          <button className="w-full rounded-xl px-4 py-3 text-left text-white/70">
            🛠 Ops Board
          </button>
          <button className="w-full rounded-xl px-4 py-3 text-left text-white/70">
            📓 Agent Tasks
          </button>
        </nav>
        <div className="mt-8 text-sm text-white/60">
          Status: <span className="font-semibold text-emerald-300">Autonomous</span>
        </div>
        <div className="mt-6">
          <p className="text-xs uppercase tracking-wide text-white/50">Agents</p>
          <div className="mt-3 space-y-2 overflow-auto pr-2">
            {AGENTS.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                  selectedAgent === agent.id
                    ? "border-emerald-300 bg-emerald-300/10 text-white"
                    : "border-white/10 text-white/70 hover:border-white/30"
                }`}
              >
                <div className="text-sm font-semibold">{agent.name}</div>
                <div className="text-xs text-white/60">{agent.title}</div>
              </button>
            ))}
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-hidden p-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl shadow-black/40">
          <header className="mb-6 border-b border-white/5 pb-6">
            <p className="text-sm text-white/60">Chatting with</p>
            <h2 className="text-3xl font-semibold text-white">{current?.name}</h2>
            <p className="text-sm text-white/50">{current?.title}</p>
          </header>
          <div className="mb-6 h-80 overflow-auto rounded-2xl border border-white/5 bg-black/20 p-6 text-sm text-white/70">
            <p className="text-white/40 text-center">No messages yet. Start the conversation below.</p>
          </div>
          <form className="flex gap-4">
            <input
              className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-white/40 focus:border-emerald-300 focus:outline-none"
              placeholder={`Message ${current?.name}...`}
            />
            <button
              type="button"
              className="rounded-2xl bg-emerald-400 px-6 py-3 font-semibold text-black shadow-lg shadow-emerald-400/40"
            >
              Send
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
