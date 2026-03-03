# Mission Control Data Tab

## Objective
Turn the Data tab into the at-a-glance control center for AI usage and spend. The v0 system prioritizes:

1. Complete visibility into token consumption and dollar cost.
2. Clear attribution by provider, agent, and project.
3. Rapid anomaly detection so Nate can approve or intervene in seconds.
4. A storage + ingestion path that is explainable, replayable, and easy to extend.

---

## Data Architecture

### Daily aggregate schema
```ts
export type UsageBreakdownItem = {
  name: string;
  tokens: number;
  cost_usd: number;
  task_url?: string;
};

export type DailyUsageRecord = {
  date: string;              // YYYY-MM-DD
  provider: string;          // e.g., "openai"
  model: string;             // e.g., "gpt-4.1"
  total_tokens: number;
  total_cost_usd: number;
  by_agent: UsageBreakdownItem[];
  by_project: UsageBreakdownItem[];
};
```

### Storage layout
| Path | Purpose |
| --- | --- |
| `data/usage/daily.json` | Source of truth for aggregated usage records. Read-only from the Next.js app. |
| `data/usage/project-metrics.json` | Optional revenue/payout metadata per project for cost-efficiency views. |
| `data/usage/source/openai-usage.json` | Raw provider export (latest pull). Not committed to prod if secrets included. |
| `data/usage/source/attribution-log.jsonl` | Append-only log of per-call metadata emitted by agents. |

_All files are JSON/JSONL for auditability, diffability, and simple Git history._

---

## Ingestion Flow (v0)
1. **Collect provider usage**
   ```bash
   curl -s "https://api.openai.com/v1/usage?start_date=2026-02-24&end_date=2026-03-02" \
     -H "Authorization: Bearer $OPENAI_API_KEY" \
     -H "OpenAI-Organization: $OPENAI_ORG" \
     > data/usage/source/openai-usage.json
   ```
   - The response is saved verbatim for traceability.
2. **Collect attribution metadata** – every agent call should emit a JSONL entry like:
   ```json
   {"timestamp":"2026-03-01T15:14:22Z","provider":"openai","model":"gpt-4.1","agent":"Henry","project":"Mission Control V2","tokens":3480,"cost_usd":0.26,"task_url":"https://linear.app/mc/BUG-123"}
   ```
3. **Run the aggregator**
   ```bash
   node scripts/ingest-openai-usage.mjs \
     --source data/usage/source/openai-usage.json \
     --attribution data/usage/source/attribution-log.jsonl \
     --out data/usage/daily.json
   ```
   - Idempotent per day: re-running replaces matching `date+provider+model` rows with the latest calculation.
   - Adds `Unattributed` buckets when attribution data is missing.
   - Emits `data/usage/anomalies.json` (coming v1) for downstream automation.
4. **(Optional) Schedule it**
   - Run via cron or OpenClaw heartbeat around 02:00 local, covering yesterday’s date.
   - When the script detects cost > 2× 7-day average it can call the Supabase task endpoint (flag guarded by env vars). v0 logs the anomaly and the UI surfaces it immediately.

---

## Attribution
- Agents tag every LLM call with `agent` + `project` + `task_url`.
- When perfect attribution is impossible, agents emit approximate percentages. The ingestion script records the accuracy flag so the UI can show a warning badge.
- `Unattributed` remains visible so Nate always knows what portion needs cleanup.

---

## Dashboard Contract
- **Summary cards**: last 7 days spend, WoW delta, and the top provider/agent/project.
- **Range filters**: last 7, last 30, or custom `?start=YYYY-MM-DD&end=YYYY-MM-DD`.
- **Charts/Tables**: line chart (daily spend), provider breakdown, top agents/projects, anomaly list, and project efficiency (tokens, $, revenue, profit).
- **Anomalies**: spend/tokens > 2× trailing 7-day average triggers a badge plus context (which agent/project spiked).
- **Explainability**: every number references its source record; hover/click reveals the underlying date + provider + model.

---

## Next Steps After v0
1. Wire ingestion to Supabase (service key) so spikes automatically open Tasks with hypotheses + next steps.
2. Add provider adapters (Anthropic, Google) by dropping raw exports in `data/usage/source/` and pointing the script at them.
3. Stream real-time usage by capturing events from agents directly rather than daily aggregates.
4. Layer margin/ROI insights: benchmark cost per deliverable, compare against payouts, alert when a project runs negative for N days.

This document stays the canonical reference—update it whenever the schema or ingestion flow changes.
