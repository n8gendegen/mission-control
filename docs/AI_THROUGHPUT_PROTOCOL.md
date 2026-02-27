# AI Dev Throughput Protocol v1.0

**Principle:** Momentum beats elegance. Ship small, mergeable commits every 45 minutes.

1. **Commit cadence**
   - Push at least once every 45 minutes unless blocked (with logs).
   - Acceptable commits include stubs, shells, scaffolds, or partial implementations.

2. **Slice size**
   - ≤3 files, ≤1 conceptual concern, mergeable without breaking build.
   - Split features into multiple slices (e.g., component shell, state, persistence, validation, polish).

3. **PR timing**
   - Draft PR must exist within 45 minutes of starting a slice.

4. **75-minute escalation**
   - If no commit in 75 minutes and no blocker, MergeBot reduces scope or reassigns work.

5. **Parallelism**
   - No agent waits >30 minutes on another. Stub/mocks allowed; merge later.

6. **Throughput dashboard**
   - Each checkpoint includes commits last 2h, longest idle, active PRs.

7. **Blast radius declaration**
   - Each slice states files touched, new deps, schema changes. If >3 files, slice is too large.

8. **Ugly is fine**
   - No premature polish/refactor until slice is merged.

9. **MergeBot authority**
   - Ensures preview equals HEAD, CI green, no stale branches/PRs. Can close/rebase/split PRs.

10. **Weekly velocity review**
    - Track average commits/day, time between commits, % PRs merged same day, stalled intervals >75m.

_All agents operate under this protocol. No exceptions._

## Enforcement Addendum (2026-02-27)
- No promises, only proof: every update must include commit/PR/evidence; future promises without proof trigger MergeBot stub commits.
- Two-strike auto-reassign: missing the 20-25min commit twice without blocker reassigns the slice; three strikes moves agent to docs/tests only.
- Daily environment readiness gate: npm ci, npm run build, npm run dev, preview deploy, and openclaw status must be green before feature work.
- Single-owner hotspot files: src/app/page.tsx owned by Henry today; others must work in isolated components. PRs touching hotspots need owner sign-off.
- One micro-PR per agent per hour: open draft PRs with stubs/TODOs even if unfinished.
- MergeBot authority: may split PRs, revert breaking commits, close stale branches, and assign stub PRs when cadence slips.
- Definition of done for micro-slices: build locally, CI green (or note defer), evidence attached, blast radius respected.
- Artifact-only commits (docs/screenshots) do not count as throughput unless paired with a functional code delta that advances acceptance criteria.
- Tracked work only: every slice must have a GitHub issue ID, and every PR must reference it (Closes/Refs #id) or it is ignored.
- Layout rebuild is split into issues L1-L4 (sidebar markup, tab state, module placeholders, SHA/footer) each with DOM proof + screenshot + CI.
- PR-first & push-often: open a draft PR within 15 minutes of starting a slice and push updates at least every 25 minutes.
- Commits-by-agent metric: dashboard must show commits per agent for the last 2 hours; agents at 0 for 2 hours are reassigned automatically.
- Proof of life each checkpoint: include git status, build output (last 10 lines or CI link), and the commit/PR updated; missing proof implies blocked.
- Stop-doing list (until layout/chat/security slices merge): no screenshot-only commits, no protocol edits, no refactors/polish, no preview polish/bundling.

