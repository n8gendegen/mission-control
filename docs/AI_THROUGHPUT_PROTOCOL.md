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
