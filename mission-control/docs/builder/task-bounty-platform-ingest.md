# Wire bounty feed ingestion + approvals pipes

## Summary
Finish the Mission Control surface + telemetry for the new HackerOne ingestion job so ops can approve/decline bounties and monitor runs.

## Definition of Done
HackerOne feed is ingesting via LaunchAgent and Mission Control shows the queue + health for operators.

## Acceptance Criteria
- Approvals view lists hackerone rows from spy_opportunities with approve/decline actions wired up.
- agent_health_status card surfaces last run, processed/inserted/error counts, and links to logs/bounty artifacts.
- README/runbook explains how to manage the launchd job and where to find logs.

## Handoff Actions
1. Document remaining steps
