# Build HackerOne connector

## Summary
Build a HackerOne connector that polls public programs + paid private invites via API token, scores opportunities based on payout band + scope, and writes normalized opportunities into `spy_opportunities` for the bounty approvals flow.

## Definition of Done
Cron-able script that authenticates with HackerOne API, fetches programs/bounties filtered by payout >$1k, normalizes into Supabase (slug, scope, payout, signal), logs run metrics, and surfaces new entries in the Bounty Approvals tab.

## Acceptance Criteria
- Uses HackerOne GraphQL `DirectoryPrograms` endpoint with pagination + API token
- Filters out programs below payout threshold and those without clear scope
- Maps scope (assets, severity, submission types) into structured JSON
- Writes opportunities into `spy_opportunities` with platform=hackerone
- Adds audit log entry with count of programs processed
- Scheduler (cron or LaunchAgent) documented at 30-minute cadence

## Handoff Actions
1. Secure API token via env var HACKERONE_API_TOKEN
2. Implement fetch + pagination utility
3. Add normalization helper to map payout/severity to our scoring model
4. Insert rows via Supabase client + de-dupe by program slug
5. Document fallback/manual refresh command
