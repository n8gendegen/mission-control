# Build YesWeHack connector

## Summary
Build a YesWeHack connector that pulls the public JSON/RSS feeds, annotates NDA/geography requirements, and stores normalized opportunities for the approvals board.

## Definition of Done
Script ingests YesWeHack programs at 30-min cadence, enriches each with NDA/geography/industry tags, writes clean rows to `spy_opportunities`, and logs metrics.

## Acceptance Criteria
- Consumes both RSS and JSON endpoints (`https://api.yeswehack.com/programs/public`)
- Captures program slug, payout band, NDA flag, geographic restrictions
- Normalizes currencies to USD and scopes to array of assets
- Upserts rows with platform='yeswehack' avoiding duplicates
- Records NDA/geography metadata in separate columns
- Cron schedule + logActivity entry documented

## Handoff Actions
1. Store YESWEHACK_API_TOKEN if private access needed
2. Add currency conversion helper
3. Implement duplication guard keyed on program slug
4. Document manual run command
