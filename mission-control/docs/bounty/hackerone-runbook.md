# HackerOne Connector Runbook

_Last updated: 2026-03-19_

## Purpose
Pull public HackerOne programs that offer bounties, score them by payout potential, and drop normalized rows into `spy_opportunities` so Spy/Sweeper/Rachel can triage high-yield work.

## Prerequisites
- `HACKERONE_API_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- Node 20+

## How to run manually
```bash
cd mission-control
HACKERONE_API_TOKEN=... npm run bounty:hackerone
```

Or use the wrapper (captures output under `logs/bounty`):
```bash
./scripts/bounty/run-hackerone.sh
```

## What the script does
1. Pages over HackerOne's GraphQL directory (`me.directoryPrograms`).
2. Filters to programs with `maxBounty >= 1000`.
3. Computes a payout band + score and upserts rows into `spy_opportunities` (conflict key = `slug`).
4. Writes a run summary to `agent_health_status` with counts for `processed`, `inserted`, and `errors` so LaunchAgent dashboards stay green.

## Outputs
- New/updated `spy_opportunities` rows with `platform = hackerone`.
- `agent_health_status` row `runner:bounty:hackerone` updated with last run details.
- Log files under `logs/bounty/hackerone-*.log` plus the aggregated agent log `logs/bounty/hackerone-agent.log`.

## LaunchAgent
- Plist: `scripts/launchagents/com.missioncontrol.bounty-hackerone.plist`.
- Install: `cp scripts/launchagents/com.missioncontrol.bounty-hackerone.plist ~/Library/LaunchAgents/`
- Load: `launchctl load ~/Library/LaunchAgents/com.missioncontrol.bounty-hackerone.plist`
- Schedule: runs every 30 minutes via `StartInterval` (adjust there if needed).
- Logs: `StandardOutPath`/`StandardErrorPath` -> `logs/bounty/hackerone-agent.log`

## Validation
- Confirm Supabase row count via `select count(*) from spy_opportunities where platform = 'hackerone';`
- Spot-check `agent_health_status` table for updated metadata.
- Ensure `logs/agents/builder-session-runner.launchd.log` shows the LaunchAgent hand-off once it’s wired.
