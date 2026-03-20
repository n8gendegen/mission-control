# Wire bounty feed ingestion + approvals pipes

## Summary
Standing up the ingestion + approvals flow so bounty feeds (Gitcoin/Dework/etc.) normalize into spy_opportunities and show up in Approvals.

## Definition of Done
ETL script + approvals hook is live: pulls at least 3 feeds, dedupes + scores them, writes into spy_opportunities, and exposes the queue in the Approvals tab with a clear accept/decline path.

## Acceptance Criteria
- Normalize Gitcoin, Dework, and at least one other feed into a common payload (slug, platform, payout range, scope JSON, source link).
- Every insert/upsert writes to spy_opportunities with platform + scoring metadata, and logs a run summary (processed/skipped/errors).
- Exposed in the Mission Control Approvals UI so operators can approve/decline each bounty with a single click.
- Scheduler/LaunchAgent runs every 30–60 minutes and surfaces errors/idempotency stats in agent_health_status.
- README/runbook explains how to add another feed + how to manually rerun the ingestion job.

## Handoff Actions
1. Document schema expectations for spy_opportunities (fields, scoring).
2. Add LaunchAgent entry for ingestion so it runs continuously.
3. Link the approvals view/screenshots in Docs so ops knows where to look.
