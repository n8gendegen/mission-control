import type { AnomalyRecord } from "../../lib/data/usage";

function formatMagnitude(value: number, metric: AnomalyRecord["metric"]) {
  return metric === "cost" ? `$${value.toFixed(2)}` : `${Math.round(value).toLocaleString()} tokens`;
}

type AnomaliesListProps = {
  anomalies: AnomalyRecord[];
};

export function AnomaliesList({ anomalies }: AnomaliesListProps) {
  return (
    <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-amber-200">Anomalies (7-day rule)</span>
        <span className="text-amber-300/70">Triggers at &gt;2× moving average</span>
      </div>
      <div className="mt-3 space-y-3">
        {anomalies.length === 0 && <div className="text-sm text-white/60">No spikes detected in the selected window.</div>}
        {anomalies.map((anomaly) => (
          <div key={`${anomaly.date}-${anomaly.metric}`} className="rounded-xl border border-white/10 bg-white/10 p-3">
            <div className="flex items-center justify-between text-sm text-white">
              <div className="font-semibold">{anomaly.date}</div>
              <div className="text-amber-200">{anomaly.metric === "cost" ? "Spend" : "Tokens"} ×{anomaly.multiplier.toFixed(1)}</div>
            </div>
            <div className="mt-1 text-xs text-white/70">
              {formatMagnitude(anomaly.actual, anomaly.metric)} vs avg {formatMagnitude(anomaly.average, anomaly.metric)}
            </div>
            <div className="mt-2 text-xs text-white/60">
              Top agents: {anomaly.topAgents.map((agent) => `${agent.name} ($${agent.costUsd.toFixed(2)})`).join(", ") || "n/a"}
            </div>
            <div className="text-xs text-white/60">
              Top projects: {anomaly.topProjects.map((project) => `${project.name} ($${project.costUsd.toFixed(2)})`).join(", ") || "n/a"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
