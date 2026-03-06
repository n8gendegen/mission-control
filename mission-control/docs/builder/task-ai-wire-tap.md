# Mission Control AI Wire Tap

## Summary
Nightly worker ingests Reuters Tech, SEC 8-K, and chip-supply advisories, normalizes them, and tags affected Mission Control lanes.

## Definition of Done
Supabase Edge Function (or cron job) fetches each feed nightly, dedupes items, stores them in ai_wire_tap_events, and inserts an alert row per impacted lane with metadata (source, headline, summary, affected assets). Configuration lives in Supabase so we can add/remove feeds without redeploying.

## Acceptance Criteria
- Worker runs on schedule and inserts at least one record per new article.
- Records capture source, title, link, published timestamp, affected_lanes array, and raw JSON payload.
- Mission Control Alert Inbox surfaces the latest five events with correct lane tags.
- Manual backfill CLI can re-run for a date range without duplicating rows.

## Handoff Actions
1. Define ai_wire_tap_events table + RPC for inserting alerts.
2. Implement fetcher modules for Reuters Tech RSS, SEC 8-K search API, and chip advisory RSS feeds.
3. Write tagging heuristics mapping keywords/tickers to Mission Control lanes.
4. Insert alerts into mission_control_alerts and display them in the Alert Inbox tile.
5. Document the runbook + environment variables for feed URLs and SEC API token.
