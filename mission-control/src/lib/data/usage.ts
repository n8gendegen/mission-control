import fallbackUsageRaw from "../../../data/usage/daily.json";
import projectMetaRaw from "../../../data/usage/project-metrics.json";

export type UsageBreakdownItem = {
  name: string;
  tokens: number;
  cost_usd: number;
  task_url?: string;
};

export type DailyUsageRecord = {
  date: string; // YYYY-MM-DD
  provider: string;
  model: string;
  total_tokens: number;
  total_cost_usd: number;
  by_agent: UsageBreakdownItem[];
  by_project: UsageBreakdownItem[];
};

export type UsageAggregateRow = {
  date: string;
  provider: string;
  model: string;
  total_tokens: number | null;
  total_cost_usd: number | null;
  by_agent?: UsageBreakdownItem[] | null;
  by_project?: UsageBreakdownItem[] | null;
};

export type RangeKey = "7d" | "30d" | "90d" | "custom";

export type UsageRangeOptions = {
  rangeKey: RangeKey;
  customStart?: string | null;
  customEnd?: string | null;
};

export type BreakdownEntry = {
  name: string;
  tokens: number;
  costUsd: number;
  taskUrl?: string;
};

export type DailySeriesPoint = {
  date: string;
  totalTokens: number;
  totalCostUsd: number;
};

export type AnomalyRecord = {
  date: string;
  metric: "cost" | "tokens";
  multiplier: number;
  actual: number;
  average: number;
  topAgents: BreakdownEntry[];
  topProjects: BreakdownEntry[];
};

export type ProjectEfficiencyRow = {
  project: string;
  tokens: number;
  costUsd: number;
  revenueUsd?: number | null;
  payoutUsd?: number | null;
  profitUsd?: number | null;
  marginPct?: number | null;
  notes?: string | null;
};

export type UsageSnapshot = {
  rangeKey: RangeKey;
  rangeLabel: string;
  startDate: string | null;
  endDate: string | null;
  totals: {
    costUsd: number;
    tokens: number;
  };
  providerBreakdown: BreakdownEntry[];
  agentBreakdown: BreakdownEntry[];
  projectBreakdown: BreakdownEntry[];
  dailySeries: DailySeriesPoint[];
  anomalies: AnomalyRecord[];
  projectEfficiency: ProjectEfficiencyRow[];
};

export type WeeklySummary = {
  latestDate: string | null;
  currentTotals: {
    costUsd: number;
    tokens: number;
  };
  previousTotals: {
    costUsd: number;
    tokens: number;
  };
  changePct: number | null;
  topAgent: BreakdownEntry | null;
  topProject: BreakdownEntry | null;
  topProvider: BreakdownEntry | null;
};

type ProjectMetaRecord = {
  name: string;
  revenue_usd?: number;
  payout_usd?: number;
  notes?: string;
};

type DailyDetail = {
  date: string;
  totalTokens: number;
  totalCostUsd: number;
  providerTotals: Map<string, BreakdownEntry>;
  agentTotals: Map<string, BreakdownEntry>;
  projectTotals: Map<string, BreakdownEntry>;
};

type AggregatedData = {
  totals: {
    tokens: number;
    costUsd: number;
  };
  providerBreakdown: BreakdownEntry[];
  agentBreakdown: BreakdownEntry[];
  projectBreakdown: BreakdownEntry[];
  dailyDetails: DailyDetail[];
};

const fallbackUsageRecords: DailyUsageRecord[] = (fallbackUsageRaw as DailyUsageRecord[]).
  map((record) => ({
    ...record,
    by_agent: (record.by_agent ?? []).map((item) => ({ ...item })),
    by_project: (record.by_project ?? []).map((item) => ({ ...item })),
  }));

const projectMeta = ((projectMetaRaw as { projects?: ProjectMetaRecord[] })?.projects ?? []) as ProjectMetaRecord[];
const projectMetaIndex = new Map(projectMeta.map((item) => [item.name, item]));

function dateStringToUtc(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

function addDays(date: string, delta: number) {
  const d = dateStringToUtc(date);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function clampDate(date: string, earliest: string | null, latest: string | null) {
  if (earliest && date < earliest) {
    return earliest;
  }
  if (latest && date > latest) {
    return latest;
  }
  return date;
}

function filterRecords(records: DailyUsageRecord[], start: string, end: string) {
  return records.filter((record) => record.date >= start && record.date <= end);
}

function addToMap(map: Map<string, BreakdownEntry>, key: string, tokens: number, costUsd: number, taskUrl?: string) {
  if (!map.has(key)) {
    map.set(key, {
      name: key,
      tokens: 0,
      costUsd: 0,
      taskUrl,
    });
  }
  const current = map.get(key)!;
  current.tokens += tokens;
  current.costUsd += costUsd;
  if (!current.taskUrl && taskUrl) {
    current.taskUrl = taskUrl;
  }
}

function mapToSortedArray(map: Map<string, BreakdownEntry>) {
  return Array.from(map.values()).sort((a, b) => b.costUsd - a.costUsd);
}

function aggregate(records: DailyUsageRecord[]): AggregatedData {
  const providerMap = new Map<string, BreakdownEntry>();
  const agentMap = new Map<string, BreakdownEntry>();
  const projectMap = new Map<string, BreakdownEntry>();
  const dailyMap = new Map<string, DailyDetail>();

  let totalTokens = 0;
  let totalCost = 0;

  for (const record of records) {
    const recordTokens = record.total_tokens || 0;
    const recordCost = record.total_cost_usd || 0;

    totalTokens += recordTokens;
    totalCost += recordCost;

    addToMap(providerMap, record.provider, recordTokens, recordCost);

    if (!dailyMap.has(record.date)) {
      dailyMap.set(record.date, {
        date: record.date,
        totalTokens: 0,
        totalCostUsd: 0,
        providerTotals: new Map(),
        agentTotals: new Map(),
        projectTotals: new Map(),
      });
    }
    const daily = dailyMap.get(record.date)!;
    daily.totalTokens += recordTokens;
    daily.totalCostUsd += recordCost;
    addToMap(daily.providerTotals, record.provider, recordTokens, recordCost);

    for (const agentEntry of record.by_agent ?? []) {
      addToMap(agentMap, agentEntry.name, agentEntry.tokens || 0, agentEntry.cost_usd || 0, agentEntry.task_url);
      addToMap(daily.agentTotals, agentEntry.name, agentEntry.tokens || 0, agentEntry.cost_usd || 0, agentEntry.task_url);
    }

    for (const projectEntry of record.by_project ?? []) {
      addToMap(projectMap, projectEntry.name, projectEntry.tokens || 0, projectEntry.cost_usd || 0, projectEntry.task_url);
      addToMap(daily.projectTotals, projectEntry.name, projectEntry.tokens || 0, projectEntry.cost_usd || 0, projectEntry.task_url);
    }
  }

  const dailyDetails = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  return {
    totals: {
      tokens: totalTokens,
      costUsd: Math.round((totalCost + Number.EPSILON) * 100) / 100,
    },
    providerBreakdown: mapToSortedArray(providerMap),
    agentBreakdown: mapToSortedArray(agentMap),
    projectBreakdown: mapToSortedArray(projectMap),
    dailyDetails,
  };
}

function getRangeBounds(
  rangeKey: RangeKey,
  customStart: string | null | undefined,
  customEnd: string | null | undefined,
  earliestDate: string | null,
  latestDate: string | null
) {
  if (!latestDate) {
    return { start: null, end: null, label: "No data" };
  }

  if (rangeKey === "custom" && customStart && customEnd) {
    const start = clampDate(customStart, earliestDate, latestDate);
    const end = clampDate(customEnd, earliestDate, latestDate);
    return {
      start,
      end,
      label: `${start} → ${end}`,
    };
  }

  const end = clampDate(customEnd ?? latestDate, earliestDate, latestDate);
  let days = 7;
  if (rangeKey === "30d") {
    days = 30;
  } else if (rangeKey === "90d") {
    days = 90;
  }
  const startCandidate = addDays(end, -(days - 1));
  const start = clampDate(startCandidate, earliestDate, latestDate);
  const labelMap: Record<RangeKey, string> = {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "90d": "Last 90 days",
    custom: `${start} → ${end}`,
  };

  return { start, end, label: labelMap[rangeKey] };
}

function detectAnomalies(dailyDetails: DailyDetail[]): AnomalyRecord[] {
  const anomalies: AnomalyRecord[] = [];
  for (let i = 0; i < dailyDetails.length; i += 1) {
    const windowStart = Math.max(0, i - 7);
    const window = dailyDetails.slice(windowStart, i);
    if (window.length < 4) {
      continue;
    }
    const avgCost = window.reduce((acc, item) => acc + item.totalCostUsd, 0) / window.length;
    const avgTokens = window.reduce((acc, item) => acc + item.totalTokens, 0) / window.length;
    const current = dailyDetails[i];
    const costMultiplier = avgCost > 0 ? current.totalCostUsd / avgCost : 0;
    if (costMultiplier >= 2) {
      anomalies.push({
        date: current.date,
        metric: "cost",
        multiplier: costMultiplier,
        actual: current.totalCostUsd,
        average: avgCost,
        topAgents: mapToSortedArray(current.agentTotals).slice(0, 3),
        topProjects: mapToSortedArray(current.projectTotals).slice(0, 3),
      });
      continue;
    }
    const tokenMultiplier = avgTokens > 0 ? current.totalTokens / avgTokens : 0;
    if (tokenMultiplier >= 2) {
      anomalies.push({
        date: current.date,
        metric: "tokens",
        multiplier: tokenMultiplier,
        actual: current.totalTokens,
        average: avgTokens,
        topAgents: mapToSortedArray(current.agentTotals).slice(0, 3),
        topProjects: mapToSortedArray(current.projectTotals).slice(0, 3),
      });
    }
  }
  return anomalies;
}

function buildProjectEfficiency(breakdown: BreakdownEntry[]): ProjectEfficiencyRow[] {
  const costMap = new Map(breakdown.map((entry) => [entry.name, entry]));
  const projectNames = [
    ...Array.from(costMap.keys()),
    ...Array.from(projectMetaIndex.keys()),
  ];
  const uniqueProjectNames = Array.from(new Set(projectNames));
  const rows: ProjectEfficiencyRow[] = [];

  for (const projectName of uniqueProjectNames) {
    const costEntry = costMap.get(projectName);
    const meta = projectMetaIndex.get(projectName);
    const tokens = costEntry?.tokens ?? 0;
    const costUsd = Math.round(((costEntry?.costUsd ?? 0) + Number.EPSILON) * 100) / 100;
    if (tokens === 0 && !meta) {
      continue;
    }
    const revenue = meta?.revenue_usd ?? null;
    const payout = meta?.payout_usd ?? null;
    const profit = revenue != null ? revenue - costUsd : null;
    const marginPct = revenue && revenue !== 0 ? (profit! / revenue) * 100 : null;
    rows.push({
      project: projectName,
      tokens,
      costUsd,
      revenueUsd: revenue,
      payoutUsd: payout,
      profitUsd: profit,
      marginPct: marginPct != null ? Math.round(marginPct * 10) / 10 : null,
      notes: meta?.notes ?? null,
    });
  }

  return rows.sort((a, b) => (b.costUsd ?? 0) - (a.costUsd ?? 0));
}

const EMPTY_SNAPSHOT: UsageSnapshot = {
  rangeKey: "7d",
  rangeLabel: "No data",
  startDate: null,
  endDate: null,
  totals: { costUsd: 0, tokens: 0 },
  providerBreakdown: [],
  agentBreakdown: [],
  projectBreakdown: [],
  dailySeries: [],
  anomalies: [],
  projectEfficiency: [],
};

export function buildUsageSnapshot(records: DailyUsageRecord[], options: UsageRangeOptions): UsageSnapshot {
  if (!records.length) {
    return { ...EMPTY_SNAPSHOT, rangeKey: options.rangeKey };
  }

  const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const earliestDate = sortedRecords[0]?.date ?? null;
  const latestDate = sortedRecords[sortedRecords.length - 1]?.date ?? null;

  const bounds = getRangeBounds(options.rangeKey, options.customStart, options.customEnd, earliestDate, latestDate);
  if (!bounds.start || !bounds.end) {
    return { ...EMPTY_SNAPSHOT, rangeKey: options.rangeKey };
  }

  const rangeRecords = filterRecords(sortedRecords, bounds.start, bounds.end);
  const aggregated = aggregate(rangeRecords);

  return {
    rangeKey: options.rangeKey,
    rangeLabel: bounds.label,
    startDate: bounds.start,
    endDate: bounds.end,
    totals: aggregated.totals,
    providerBreakdown: aggregated.providerBreakdown,
    agentBreakdown: aggregated.agentBreakdown,
    projectBreakdown: aggregated.projectBreakdown,
    dailySeries: aggregated.dailyDetails.map((detail) => ({
      date: detail.date,
      totalTokens: detail.totalTokens,
      totalCostUsd: detail.totalCostUsd,
    })),
    anomalies: detectAnomalies(aggregated.dailyDetails),
    projectEfficiency: buildProjectEfficiency(aggregated.projectBreakdown).slice(0, 5),
  };
}

export function getWeeklySummary(records: DailyUsageRecord[]): WeeklySummary {
  if (!records.length) {
    return {
      latestDate: null,
      currentTotals: { costUsd: 0, tokens: 0 },
      previousTotals: { costUsd: 0, tokens: 0 },
      changePct: null,
      topAgent: null,
      topProject: null,
      topProvider: null,
    };
  }

  const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const latestDate = sortedRecords[sortedRecords.length - 1]?.date ?? null;
  if (!latestDate) {
    return {
      latestDate: null,
      currentTotals: { costUsd: 0, tokens: 0 },
      previousTotals: { costUsd: 0, tokens: 0 },
      changePct: null,
      topAgent: null,
      topProject: null,
      topProvider: null,
    };
  }

  const currentStart = addDays(latestDate, -6);
  const previousEnd = addDays(currentStart, -1);
  const previousStart = addDays(previousEnd, -6);

  const currentAgg = aggregate(filterRecords(sortedRecords, currentStart, latestDate));
  const previousAgg = aggregate(filterRecords(sortedRecords, previousStart, previousEnd));

  const previousCost = previousAgg.totals.costUsd || 0;
  const currentCost = currentAgg.totals.costUsd || 0;
  const changePct = previousCost > 0 ? ((currentCost - previousCost) / previousCost) * 100 : null;

  return {
    latestDate,
    currentTotals: currentAgg.totals,
    previousTotals: previousAgg.totals,
    changePct,
    topAgent: currentAgg.agentBreakdown[0] ?? null,
    topProject: currentAgg.projectBreakdown[0] ?? null,
    topProvider: currentAgg.providerBreakdown[0] ?? null,
  };
}

export function formatCurrency(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
  }).format(value);
}

export function formatTokens(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M tokens`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K tokens`;
  }
  return `${value.toLocaleString()} tokens`;
}

export function getRangeOptions() {
  return [
    { label: "Last 7 days", value: "7d" as RangeKey },
    { label: "Last 30 days", value: "30d" as RangeKey },
    { label: "Last 90 days", value: "90d" as RangeKey },
  ];
}

export function getFallbackUsageRecords(): DailyUsageRecord[] {
  return fallbackUsageRecords.map((record) => ({
    ...record,
    by_agent: record.by_agent.map((item) => ({ ...item })),
    by_project: record.by_project.map((item) => ({ ...item })),
  }));
}

export function normalizeAggregateRows(rows: UsageAggregateRow[]): DailyUsageRecord[] {
  return rows.map((row) => ({
    date: row.date,
    provider: row.provider,
    model: row.model,
    total_tokens: row.total_tokens ?? 0,
    total_cost_usd: row.total_cost_usd ?? 0,
    by_agent: normalizeBreakdown(row.by_agent),
    by_project: normalizeBreakdown(row.by_project),
  }));
}

function normalizeBreakdown(entries?: UsageBreakdownItem[] | null): UsageBreakdownItem[] {
  if (!entries) {
    return [];
  }
  return entries.map((entry) => ({
    name: entry.name || (entry as any).agent || (entry as any).project || "Unattributed",
    tokens: Number(entry.tokens) || 0,
    cost_usd: Number(entry.cost_usd) || 0,
    task_url: entry.task_url,
  }));
}
