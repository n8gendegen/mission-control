"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Opportunity {
  id: string;
  source: string;
  external_id: string;
  title: string;
  summary: string;
  tags: string[];
  payout_usd: number;
  listing_url: string;
  repo_url: string;
  fit_score: number;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  claim_status: string;
  repo_full_name: string;
  issue_number: number | null;
}

interface Stats {
  total: number;
  new: number;
  approved: number;
}

export default function BountyPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, new: 0, approved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "new" | "approved">("new");

  useEffect(() => {
    fetchOpportunities();
  }, [filter]);

  async function fetchOpportunities() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bounty/opportunities?status=${filter}&limit=50`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setOpportunities(data.opportunities || []);
      setStats(data.stats || { total: 0, new: 0, approved: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    const res = await fetch("/api/bounty/opportunities", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    if (res.ok) {
      setOpportunities((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
      );
      // Refresh stats
      fetchOpportunities();
    }
  }

  function formatCurrency(amount: number) {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  const sourceLabel: Record<string, string> = {
    immunefi: "Immunefi",
    hackerone: "HackerOne",
    bugcrowd: "BugCrowd",
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto w-full max-w-7xl px-6 py-10">
        <header className="mb-8 rounded-3xl border border-white/5 bg-[#0d1018] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.5em] text-white/40">Bounty</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Pipeline + Connectors</h1>
            </div>
            <div className="flex gap-3">
              <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">
                Immunefi · Live
              </span>
              <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-sm text-amber-200">
                HackerOne · Waiting
              </span>
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#0b0f16] p-4 text-center">
            <p className="text-3xl font-bold text-white">{stats.total}</p>
            <p className="text-sm text-white/50">Total Programs</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b0f16] p-4 text-center">
            <p className="text-3xl font-bold text-emerald-400">{stats.new}</p>
            <p className="text-sm text-white/50">New</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b0f16] p-4 text-center">
            <p className="text-3xl font-bold text-blue-400">{stats.approved}</p>
            <p className="text-sm text-white/50">Approved</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="mb-4 flex gap-2">
          {(["all", "new", "approved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-4 py-2 text-sm transition ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-blue-500" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            Error: {error}
          </div>
        ) : opportunities.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-white/40">
            <p className="text-lg">No opportunities found</p>
            <p className="text-sm">Check back when the Immunefi connector runs</p>
          </div>
        ) : (
          <div className="space-y-3">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className="group rounded-2xl border border-white/10 bg-[#0b0f16] p-5 hover:border-white/20 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">
                        {sourceLabel[opp.source] || opp.source}
                      </span>
                      <h3 className="truncate text-lg font-medium text-white">{opp.title}</h3>
                      {opp.fit_score >= 95 && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                          High Fit
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-white/50">{opp.summary}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(opp.tags as string[]).slice(0, 6).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/40"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xl font-bold text-emerald-400">
                      {formatCurrency(opp.payout_usd)}
                    </span>
                    <span className="text-xs text-white/30">{timeAgo(opp.created_at)}</span>
                    <div className="mt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                      {opp.status === "new" && (
                        <>
                          <button
                            onClick={() => updateStatus(opp.id, "approved")}
                            className="rounded-lg bg-emerald-600 px-3 py-1 text-xs text-white hover:bg-emerald-500"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateStatus(opp.id, "rejected")}
                            className="rounded-lg bg-white/10 px-3 py-1 text-xs text-white/60 hover:bg-white/20"
                          >
                            Skip
                          </button>
                        </>
                      )}
                      {opp.status === "approved" && (
                        <a
                          href={opp.listing_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-500"
                        >
                          View Program →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/50">
          <Link href="/approvals" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10">
            Approvals queue →
          </Link>
        </div>
      </main>
    </div>
  );
}
