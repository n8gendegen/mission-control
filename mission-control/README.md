# Mission Control Dashboard

A single-page Next.js dashboard that mirrors the Mission Control UI spec (sidebar navigation, top metrics bar, Kanban board, and live activity rail).

## Local Development

```bash
npm install
npm run dev
```

This launches the app at `http://localhost:3000`.

## Checks

Run lint and build before committing:

```bash
npm run lint
npm run build
```

## Layout Checklist

Follow this list before promoting any change:

1. **Shell:** Sidebar stays fixed at `w-64` on the left; main canvas uses flex-1 with `px-8 py-6` padding and at least `space-y-6` between sections.
2. **Top bar:** Mission Control heading + metrics tray render on one horizontal row with Pause/Ping/Search controls on the right and the four metric tiles aligned horizontally.
3. **Kanban board:** Backlog / In Progress / Rev columns sit side-by-side (each `flex-1` with min-width ~280px) and show the static task cards with hover lift.
4. **Live Activity rail:** Dedicated column on the far right (`w-80`) with the “Live Activity” title, six cards, and compact timestamps.
5. **Theme polish:** Gradient background, glass cards, and button styles remain consistent with the reference screenshot.

If any of these sections appear broken, run `npm run lint` / `npm run build` to confirm there are no compile errors, then check the deployed Vercel preview before merging.

## Visual Regression

Run Playwright snapshot tests locally with:

```bash
npm run dev &
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:visual
```

Or rely on `npm run test:visual` after starting `npm run start` in another terminal.

## Auto-Assignment Worker

The backlog triage worker lives at `scripts/auto-assign-tasks.mjs`. It scans unassigned backlog / rev tasks, routes each one to the right agent (lane + keyword heuristics + capacity), updates the task owner/status, and logs the decision in `activity_log`.

### Running manually

```bash
cd mission-control
npm run worker:auto-assign -- --dry-run   # inspect output only
npm run worker:auto-assign               # assign for real (requires SUPABASE_SERVICE_ROLE_KEY)
```

Env vars:

- `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY`
- Optional: `AUTO_ASSIGN_LIMIT`, `AUTO_ASSIGN_MAX_ACTIVE`

Use a cron / scheduled function (10–30 min cadence) to call `node scripts/auto-assign-tasks.mjs` so backlog tasks keep flowing without manual triage.

### GitHub Actions scheduler

The workflow `.github/workflows/auto-assign.yml` runs every 30 minutes, but a gating step ensures:

- **Awake window (06:00–22:00 America/New_York):** executes only on the top of the hour.
- **Sleep window (22:30–05:30):** executes every half hour.

Provide the following repo secrets/variables:

| Type  | Name                        | Purpose                                  |
|-------|-----------------------------|------------------------------------------|
| Secret| `SUPABASE_URL`              | Supabase project URL                     |
| Secret| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for task updates        |
| Var   | `AUTO_ASSIGN_LIMIT`         | Optional per-run candidate limit override|
| Var   | `AUTO_ASSIGN_MAX_ACTIVE`    | Optional override for load balancing     |

Trigger manually anytime via the *Actions → Auto-assign Mission Control backlog* workflow.


## Supabase Activity Log

Mission Control now stores activity events in Supabase so the sidebar rail can stream real-time updates. Configure the following environment variables locally (e.g. in `.env.local`) and in Vercel/GitHub:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL` (Postgres connection string for migrations)

### Applying migrations

Add new SQL files under `supabase/migrations/` and push them with:

```bash
npm run db:migrate
```

The script simply proxies `supabase db push --db-url $SUPABASE_DB_URL`, so no secrets are ever committed.

### Logging helper

Use `shared/log-activity.js` (Node/worker contexts) or `src/lib/activity/logActivity.ts` (Next.js data layer) to write/read `activity_log`. Both helpers pull credentials from the env vars above—no hard-coded URLs or keys.

