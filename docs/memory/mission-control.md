# Mission Control System Memory

## Core Stack (2026-03-14)
**Frontend**:
- Next.js 14 (Vercel-hosted)
- Tailwind CSS

**Data Layer**:
- Supabase (Postgres)
  - Key Tables:
    - `activity_log` (Agent telemetry)
    - `agent_work_sessions` (Dispatcher queue)
    - TODO: Confirm alert schema

**Automation Spine**:
- GitHub Actions → `.github/workflows/auto-assign.yml`
- Node.js dispatcher → `scripts/agent-dispatcher.mjs`

## Active Workflows
1. **Auto-Assign Protocol**
   - Triggers on GitHub workflow runs
   - Maps to Supabase RPC calls
   - Current tracked runs: #22672409844, #22672709199

2. **Alert Inbox**
   - Sources:
     - Stuck dispatch rows
     - TODO: Add runner heartbeat monitoring

3. **Content Ops**
   - YouTube API integration (WIP)
   - Mock UI at `/content`

4. **Agent Health**
   - Manual seed row: `01d97c97-bab3-4b29-85a5-9c70e41d6954`
   - Blocked on automatic logging

## Governance
**Acceptance Criteria**:
- ✅ 99.9% uptime for core alerting
- ✅ Manual override layers
- ❌ Automated health checks (TBD)

**Security**:
- All agent comms through signed JWTs
- TODO: Document key rotation schedule

## Known Gaps
1. Architecture docs (original file missing)
2. Supabase table relationships
3. YouTube API quota allocation

---
*Rebuilt from MEMORY.md + projects.md + 2026-03-* logs*