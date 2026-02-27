"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";

const AGENTS = [
  { id: "henry", name: "Henry", title: "CEO / Operator" },
  { id: "steve", name: "Steve", title: "Senior Coding Agent" },
  { id: "ops", name: "Ops Sentinel", title: "Treasury Ops" },
  { id: "intel", name: "Intel Scout", title: "Market Intel" },
];

const PANELS = [
  { id: "chat", label: "Chat", icon: "💬", blurb: "Converse with agents." },
  { id: "revenue", label: "Revenue Labs", icon: "💹", blurb: "Monetization experiments." },
  { id: "ops", label: "Ops Board", icon: "🛠", blurb: "Execution lanes." },
  { id: "agents", label: "Agent Tasks", icon: "🤖", blurb: "Playbooks + notes." },
  { id: "data", label: "Data Usage", icon: "📈", blurb: "Model spend + usage." },
  { id: "security", label: "Security", icon: "🛡", blurb: "Keys + audits." },
  { id: "approvals", label: "Approvals", icon: "✅", blurb: "Items waiting on your go/no-go." },
  { id: "projects", label: "Projects", icon: "📁", blurb: "Dedicated workstreams." }
];

const STORAGE_KEY = "mc-chat-history";
const RETENTION_DAYS = 90;
const RETENTION_MAX = 500;

interface ChatMessage {
  id: string;
  agentId: string;
  role: "user" | "agent";
  text: string;
  timestamp: number;
}

type HistoryMap = Record<string, ChatMessage[]>;

const welcomeMessage = (agentId: string): ChatMessage => ({
  id: nanoid(),
  agentId,
  role: "agent",
  text: `Connected to ${
    AGENTS.find((a) => a.id === agentId)?.name || "agent"
  }. Say what you need.`,
  timestamp: Date.now(),
});

const buildSeedHistory = (): HistoryMap => {
  return AGENTS.reduce<HistoryMap>((acc, agent) => {
    acc[agent.id] = [welcomeMessage(agent.id)];
    return acc;
  }, {} as HistoryMap);
};

import { Sidebar } from "@/components/layout/Sidebar";

export default function Home() {
  const [selectedAgent, setSelectedAgent] = useState<string>(AGENTS[0].id);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<HistoryMap>({});
  const [activePanel, setActivePanel] = useState<string>("chat");

  const loadHistory = useCallback(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = buildSeedHistory();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      setHistory(seed);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as HistoryMap;
      setHistory(parsed);
    } catch {
      const seed = buildSeedHistory();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      setHistory(seed);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const persistHistory = useCallback((next: HistoryMap) => {
    setHistory(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }, []);

  const currentMessages = useMemo(() => history[selectedAgent] || [], [history, selectedAgent]);

  const addMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const timestamp = Date.now();
    const nextMsg: ChatMessage = {
      id: nanoid(),
      agentId: selectedAgent,
      role: "user",
      text: trimmed,
      timestamp,
    };
    const updated = { ...history };
    const existing = updated[selectedAgent] ? [...updated[selectedAgent]] : [];
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const filtered = existing.filter((msg) => msg.timestamp >= cutoff);
    filtered.push(nextMsg);
    while (filtered.length > RETENTION_MAX) {
      filtered.shift();
    }
    updated[selectedAgent] = filtered;
    persistHistory(updated);
    setInput("");
  };

  const clearHistory = () => {
    const updated = { ...history, [selectedAgent]: [welcomeMessage(selectedAgent)] };
    persistHistory(updated);
  };

  const renderPlaceholder = (panelId: string) => (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl shadow-black/40">
      <p className="text-sm uppercase tracking-[0.4em] text-white/40">{PANELS.find(p => p.id === panelId)?.label}</p>
      <h2 className="text-3xl font-semibold mt-2 mb-4 flex items-center gap-2">
        {PANELS.find(p => p.id === panelId)?.icon}
        {PANELS.find(p => p.id === panelId)?.label}
      </h2>
      <p className="text-white/60">
        {PANELS.find(p => p.id === panelId)?.blurb || "This panel is under construction."}
      </p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      <Sidebar />

      <main className="ml-[240px] flex-1 p-10">
        {activePanel === "chat" ? (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/40">Chatting with</p>
                <h2 className="text-3xl font-semibold">
                  {AGENTS.find((agent) => agent.id === selectedAgent)?.name}
                </h2>
                <p className="text-sm text-white/50">
                  {AGENTS.find((agent) => agent.id === selectedAgent)?.title}
                </p>
              </div>
              <button
                onClick={clearHistory}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/70 hover:border-white/40"
              >
                Clear history
              </button>
            </div>
            <div className="mb-6 h-[60vh] overflow-auto rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl shadow-black/40">
              {currentMessages.length === 0 ? (
                <p className="text-center text-white/30">No messages yet.</p>
              ) : (
                <ul className="space-y-4">
                  {currentMessages.map((msg) => (
                    <li
                      key={msg.id}
                      className={`max-w-2xl rounded-2xl px-4 py-3 text-sm shadow ${
                        msg.role === "user"
                          ? "ml-auto bg-emerald-400/20 text-emerald-100"
                          : "mr-auto bg-white/10 text-white"
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                      <p className="mt-1 text-[11px] opacity-60">
                        {new Date(msg.timestamp).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addMessage(input);
              }}
              className="flex gap-4"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Message ${
                  AGENTS.find((agent) => agent.id === selectedAgent)?.name || "agent"
                }...`}
                className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-white/40 focus:border-emerald-300 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-2xl bg-emerald-300 px-6 py-3 font-semibold text-black shadow-lg shadow-emerald-400/40"
              >
                Send
              </button>
            </form>
          </>
        ) : (
          renderPlaceholder(activePanel)
        )}
      </main>
    </div>
  );
}
