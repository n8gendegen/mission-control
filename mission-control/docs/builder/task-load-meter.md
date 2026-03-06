# Add Mission Control load meter

## Summary
Expose a Mission Control “load meter” card that rolls up active tasks/experiments into a simple availability score so Nate knows when the team can absorb new work.

## Definition of Done
Supabase view or RPC aggregates tasks by owner/status, computes story-point equivalents, and exposes an API that the UI tile consumes. Mission Control shows a load meter card with color-coded ranges (green/yellow/red) and textual guidance (“Steve has 2 tasks left, ETA 3 days”).

## Acceptance Criteria
- Data layer returns total active work, per-agent workload, and projected completion dates.
- Mission Control dashboard tile shows meter + supporting text and updates automatically when tasks change.
- Hover/expand reveals the top tasks contributing to the load.
- Meter recalculates at least every 5 minutes (via Supabase subscription or cron).

## Handoff Actions
1. Define workload scoring model (simple point per task, bumped for blockers/estimates).
2. Create Supabase RPC/view that outputs load metrics per agent + global summary.
3. Add Mission Control tile component with gauge + list of contributors.
4. Wire Live Activity/alerts when load crosses thresholds.
5. Document how to adjust scoring + thresholds.
