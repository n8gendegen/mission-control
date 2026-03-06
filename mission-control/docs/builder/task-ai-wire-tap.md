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
1. Implement fetcher modules for Reuters Tech RSS, SEC 8-K search API, and chip advisory RSS feeds.
1. Write tagging heuristics mapping keywords/tickers to Mission Control lanes.
1. Insert alerts into mission_control_alerts and display them in the Alert Inbox tile.
1. Document the runbook + environment variables for feed URLs and SEC API token.

## Spec
# Mission Control AI Wire Tap\n\n## Goal\nNightly automation ingests AI-relevant external signals (Reuters Tech, SEC 8-K, chip advisories) and raises alerts for affected Mission Control lanes.\n\n## Architecture\n- Supabase Edge Function scheduled via cron\n- Fetch adapters for each feed (RSS + SEC API)\n- ai_wire_tap_events table stores normalized entries\n- mapper.ts maps keywords/tickers to Mission Control lanes\n- Alert writer inserts into mission_control_alerts table\n\n## Data model\nai_wire_tap_events\n- id UUID\n- source text\n- title text\n- link text\n- published_at timestamptz\n- summary text\n- affected_lanes text[]\n- raw jsonb\n\n## Steps\n1. Build fetchers for Reuters, SEC, chip advisories using node-fetch.\n2. Normalize entries + hash to avoid duplicates before insert.\n3. Apply tagging heuristics (keyword arrays per lane).\n4. Insert event rows + mission_control_alerts entries.\n5. Wire Alert Inbox to show most recent events with filter pills.\n6. Provide manual backfill CLI (date range).