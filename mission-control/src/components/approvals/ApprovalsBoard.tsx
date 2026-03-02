"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ApprovalRecord, ApprovalStatus } from "../../lib/data/types";
import { supabase } from "../../lib/supabase/client";

const statusStyles: Record<ApprovalStatus, string> = {
  pending: "bg-amber-500/15 text-amber-200 border border-amber-500/30",
  approved: "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30",
  rejected: "bg-rose-500/15 text-rose-200 border border-rose-500/30",
};

const statusLabels: Record<ApprovalStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

type ApprovalRow = {
  id: string;
  slug: string | null;
  title: string;
  summary: string;
  technical_scope: string | null;
  payout_usd: number | null;
  time_estimate_hours_min: number | null;
  time_estimate_hours_max: number | null;
  token_estimate: number | null;
  token_cost_usd: number | null;
  expected_profit_usd: number | null;
  recommendation: string | null;
  status: ApprovalStatus;
  listing_url: string | null;
  repo_url: string | null;
  created_at: string | null;
};

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

function formatRange(min?: number | null, max?: number | null) {
  if (min == null && max == null) return "—";
  if (min != null && max != null) {
    return `${min.toFixed(1)}–${max.toFixed(1)} h`;
  }
  const value = min ?? max ?? 0;
  return `${value.toFixed(1)} h`;
}

function mapRow(row: ApprovalRow): ApprovalRecord {
  return {
    id: row.slug ?? row.id,
    rowId: row.id,
    title: row.title,
    summary: row.summary,
    technicalScope: row.technical_scope,
    payoutUsd: row.payout_usd,
    timeEstimateHoursMin: row.time_estimate_hours_min,
    timeEstimateHoursMax: row.time_estimate_hours_max,
    tokenEstimate: row.token_estimate,
    tokenCostUsd: row.token_cost_usd,
    expectedProfitUsd: row.expected_profit_usd,
    recommendation: row.recommendation,
    status: row.status,
    listingUrl: row.listing_url,
    repoUrl: row.repo_url,
    createdAt: row.created_at,
  };
}

export function ApprovalsBoard() {
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchApprovals() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("approvals")
        .select(
          "id,slug,title,summary,technical_scope,payout_usd,time_estimate_hours_min,time_estimate_hours_max,token_estimate,token_cost_usd,expected_profit_usd,recommendation,status,listing_url,repo_url,created_at"
        )
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error("Unable to load approvals", error);
        setError("Unable to load approvals");
        setApprovals([]);
      } else {
        setError(null);
        setApprovals((data ?? []).map(mapRow));
      }
      setIsLoading(false);
    }

    fetchApprovals();

    return () => {
      isMounted = false;
    };
  }, []);

  const totals = useMemo(() => {
    return approvals.reduce(
      (acc, approval) => {
        acc.totalPayout += approval.payoutUsd ?? 0;
        acc.totalProfit += approval.expectedProfitUsd ?? 0;
        if (approval.status === "pending") acc.pending += 1;
        return acc;
      },
      { totalPayout: 0, totalProfit: 0, pending: 0 }
    );
  }, [approvals]);

  const handleStatusChange = async (approvalId: string, status: ApprovalStatus) => {
    const previous = approvals.map((item) => ({ ...item }));
    setUpdatingId(approvalId + status);
    setApprovals((prev) =>
      prev.map((item) =>
        item.id === approvalId
          ? {
              ...item,
              status,
            }
          : item
      )
    );

    const rowId = previous.find((item) => item.id === approvalId)?.rowId;
    if (!rowId) {
      console.error("Missing approval rowId");
      setUpdatingId(null);
      setApprovals(previous);
      return;
    }

    const { error } = await supabase
      .from("approvals")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", rowId);

    if (error) {
      console.error("Failed to update approval status", error);
      setApprovals(previous);
    }
    setUpdatingId(null);
  };

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-white/5 bg-[#0b0f16] p-6">
        <div className="mb-6 h-6 w-48 animate-pulse rounded-full bg-white/10" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-36 animate-pulse rounded-2xl border border-white/5 bg-white/5" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-100">
        {error}. Check Supabase credentials or try again later.
      </section>
    );
  }

  if (approvals.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-white/10 bg-[#0b0f16]/80 p-10 text-center text-white/60">
        No approvals in the queue yet. Add a bounty or project proposal to get started.
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/5 bg-[#11131a] p-4 text-white">
          <p className="text-xs uppercase tracking-[0.4em] text-white/40">Pending approvals</p>
          <p className="mt-2 text-3xl font-semibold text-amber-200">{totals.pending}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#11131a] p-4 text-white">
          <p className="text-xs uppercase tracking-[0.4em] text-white/40">Total payout</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-200">{formatCurrency(totals.totalPayout)}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#11131a] p-4 text-white">
          <p className="text-xs uppercase tracking-[0.4em] text-white/40">Expected profit</p>
          <p className="mt-2 text-3xl font-semibold text-cyan-200">{formatCurrency(totals.totalProfit)}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {approvals.map((approval) => (
          <article key={approval.id} className="rounded-2xl border border-white/5 bg-[#11131a] p-5 text-white/80">
            <header className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/40">
                  {approval.recommendation ?? "Recommendation pending"}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">{approval.title}</h3>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[approval.status]}`}>
                {statusLabels[approval.status]}
              </span>
            </header>
            <p className="mt-3 text-sm text-white/60">{approval.summary}</p>
            {approval.technicalScope && (
              <p className="mt-2 text-xs text-white/40">{approval.technicalScope}</p>
            )}
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/70">
              <div>
                <dt className="text-xs uppercase tracking-[0.3em] text-white/40">Fee</dt>
                <dd className="text-white">{formatCurrency(approval.payoutUsd)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.3em] text-white/40">Profit</dt>
                <dd className="text-emerald-200">{formatCurrency(approval.expectedProfitUsd)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.3em] text-white/40">Time</dt>
                <dd>{formatRange(approval.timeEstimateHoursMin, approval.timeEstimateHoursMax)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.3em] text-white/40">Tokens</dt>
                <dd>
                  {approval.tokenEstimate ? `${approval.tokenEstimate.toLocaleString()} (~${formatCurrency(approval.tokenCostUsd)})` : "—"}
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              {approval.listingUrl && (
                <a
                  href={approval.listingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/10 px-3 py-1 text-white/70 hover:text-white"
                >
                  View listing ↗
                </a>
              )}
              {approval.repoUrl && (
                <a
                  href={approval.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/10 px-3 py-1 text-white/70 hover:text-white"
                >
                  Repo ↗
                </a>
              )}
            </div>
            <div className="mt-4 flex gap-3">
              <button
                disabled={approval.status === "approved" || updatingId === approval.id + "approved"}
                onClick={() => handleStatusChange(approval.id, "approved")}
                className="rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100 disabled:opacity-30"
              >
                Approve
              </button>
              <button
                disabled={approval.status === "rejected" || updatingId === approval.id + "rejected"}
                onClick={() => handleStatusChange(approval.id, "rejected")}
                className="rounded-full bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-100 disabled:opacity-30"
              >
                Reject
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
