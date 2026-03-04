import { Sidebar } from "../../components/layout/Sidebar";
import { TopBar } from "../../components/layout/TopBar";
import { SummaryCard } from "../../components/data/SummaryCard";
import { RangeFilter } from "../../components/data/RangeFilter";
import { DailySpendChart } from "../../components/data/DailySpendChart";
import { ProviderBreakdown } from "../../components/data/ProviderBreakdown";
import { UsageTable } from "../../components/data/UsageTable";
import { AnomaliesList } from "../../components/data/AnomaliesList";
import { ProjectEfficiencyTable } from "../../components/data/ProjectEfficiencyTable";
import { DataProvenanceCard } from "../../components/data/DataProvenanceCard";
import {
  buildUsageSnapshot,
  formatCurrency,
  formatTokens,
  getWeeklySummary,
  getFallbackUsageRecords,
  normalizeAggregateRows,
  type RangeKey,
  type UsageAggregateRow,
  type DailyUsageRecord,
} from "../../lib/data/usage";
import { getSupabaseClient } from "../../lib/supabase/client";

const VALID_RANGES: RangeKey[] = ["7d", "30d", "90d"];

type DataPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function resolveRangeKey(value?: string | string[]): RangeKey {
  if (typeof value === "string" && VALID_RANGES.includes(value as RangeKey)) {
    return value as RangeKey;
  }
  return "30d";
}

function getQueryDate(daysAgo: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

async function fetchUsageRecords(): Promise<DailyUsageRecord[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return getFallbackUsageRecords();
  }

  const ninetyDaysAgo = getQueryDate(120);
  const { data, error } = await supabase
    .from("usage_daily_aggregates")
    .select("date,provider,model,total_tokens,total_cost_usd,by_agent,by_project")
    .gte("date", ninetyDaysAgo)
    .order("date", { ascending: true });

  if (error) {
    console.warn("Failed to load usage aggregates from Supabase", error.message);
    return getFallbackUsageRecords();
  }

  const rows = (data ?? []) as UsageAggregateRow[];
  if (!rows.length) {
    return getFallbackUsageRecords();
  }

  return normalizeAggregateRows(rows);
}

export default async function DataPage({ searchParams = {} }: DataPageProps) {
  const rangeKey = resolveRangeKey(searchParams.range);
  const usageRecords = await fetchUsageRecords();

  const snapshot = buildUsageSnapshot(usageRecords, {
    rangeKey,
    customStart: typeof searchParams.start === "string" ? searchParams.start : undefined,
    customEnd: typeof searchParams.end === "string" ? searchParams.end : undefined,
  });
  const weekly = getWeeklySummary(usageRecords);

  const changeValue = weekly.changePct != null ? `${weekly.changePct >= 0 ? "+" : ""}${weekly.changePct.toFixed(1)}%` : "n/a";
  const changeTone: "positive" | "negative" | "neutral" =
    weekly.changePct == null ? "neutral" : weekly.changePct >= 0 ? "negative" : "positive"; // higher spend => negative tone

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="flex flex-1 flex-col space-y-6 px-8 py-6">
        <TopBar />
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-white">Data &amp; Spend</h1>
              <p className="text-sm text-white/60">{snapshot.rangeLabel}</p>
            </div>
            <RangeFilter current={rangeKey} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <SummaryCard
              title="This week’s AI spend"
              value={formatCurrency(weekly.currentTotals.costUsd)}
              secondary={formatTokens(weekly.currentTotals.tokens)}
              helper={weekly.latestDate ? `Through ${weekly.latestDate}` : undefined}
            />
            <SummaryCard
              title="Change vs last week"
              value={changeValue}
              secondary={`Prev: ${formatCurrency(weekly.previousTotals.costUsd)}`}
              badgeLabel={weekly.changePct != null ? (weekly.changePct >= 0 ? "↑" : "↓") : undefined}
              badgeTone={changeTone}
            />
            <SummaryCard
              title="Top agent by usage"
              value={weekly.topAgent?.name ?? "n/a"}
              secondary={weekly.topAgent ? `${formatCurrency(weekly.topAgent.costUsd)} • ${formatTokens(weekly.topAgent.tokens)}` : "Collect attribution to rank agents"}
            />
            <SummaryCard
              title="Top project"
              value={weekly.topProject?.name ?? "n/a"}
              secondary={weekly.topProject ? `${formatCurrency(weekly.topProject.costUsd)} • ${formatTokens(weekly.topProject.tokens)}` : "No project tags yet"}
            />
            <SummaryCard
              title="Top provider"
              value={weekly.topProvider?.name ?? "n/a"}
              secondary={weekly.topProvider ? formatCurrency(weekly.topProvider.costUsd) : "Awaiting provider data"}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <DailySpendChart data={snapshot.dailySeries} />
            </div>
            <ProviderBreakdown data={snapshot.providerBreakdown} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <UsageTable title="Top agents" rows={snapshot.agentBreakdown} emptyLabel="No agent attribution yet." />
            <UsageTable title="Top projects" rows={snapshot.projectBreakdown} emptyLabel="No project attribution yet." />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <AnomaliesList anomalies={snapshot.anomalies} />
            <ProjectEfficiencyTable rows={snapshot.projectEfficiency} />
          </div>

          <DataProvenanceCard latestDate={weekly.latestDate} />
        </section>
      </main>
    </div>
  );
}
