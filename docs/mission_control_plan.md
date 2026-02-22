# Mission Control v1 Plan

## Scope (MVP)
1. **Chat Console** – embedded version of this conversation stream with quick commands/actions.
2. **Revenue Lab** – pipeline board for new revenue ideas, experiments, and decision logs.
3. **News Radar** – curated feed focused on AI/frontier tech (Musk-scale), and crypto/blockchain.
4. **Ops Board** – Kanban tracker for Henry-owned tasks (Backlog → In Progress → Blocked → Done).

## Layout Overview
- **Top Bar:** Date/time, next meeting preview, alert badges, global search/command palette.
- **Left Navigation:** Chat Console, Revenue Lab, News Radar, Ops Board, plus space for future modules.
- **Main Workspace:** Module-specific layout with responsive design (desktop-first, tablet-friendly).

## Module Notes
### Chat Console
- Thread view with filters (alerts, decisions, brainstorms).
- Quick-action sidebar: create task, log idea to Revenue Lab, pull news digest.
- Stores conversation context in backend for cross-module linking.

### Revenue Lab
- Board/table toggle with filters (stage, category, priority).
- Idea cards include TAM snapshot, hypothesis, owner, next step, confidence.
- Detail drawer with Markdown editor, attachment links, decision history.

### News Radar
- Tabs: AI, Frontier/Musk, Crypto.
- Ranked cards with headline, 2-line summary, “Why it matters for Nate,” source, timestamp.
- Actions: Save to Revenue Lab, share to Chat Console, mute/snooze source.
- Sources: curated RSS + Brave Search + future custom scrapers.

### Ops Board
- Kanban columns + drag/drop.
- Cards contain title, impact tag (Ops/Revenue/Personal), due date, links back to chat/revenue items.
- Automation hooks for daily digest + overdue pings (future).

## Architecture
- **Frontend:** Next.js (App Router) + Tailwind CSS + shadcn/ui components.
- **State/Data:** React Query (TanStack) + Zustand for local UI state.
- **Backend:** Supabase (Postgres, Auth, Row Level Security) + Edge Functions for cron/tasks.
- **Integrations:** Brave Search API, RSS fetchers via serverless jobs, browser-based scraping via authenticated puppeteer if needed later.
- **Hosting:** Vercel for frontend; Supabase managed backend. Migrate to Apollo infra when required.
- **Auth:** Single-user (Nate) for now with email magic link; architecture supports future SSO swap.

## Implementation Phases
1. **Design:** Low-fi wireframes → hi-fi mockups. Validate layout + UX with Nate.
2. **Scaffold:** Bootstrap Next.js repo, configure Supabase project, set up UI kit.
3. **News Radar First:** Build ingestion jobs + UI cards so Mission Control always has live content.
4. **Revenue Lab + Ops Board:** Define database schema, API routes, board interactions, linking to chat tasks.
5. **Chat Console Integration:** Bridge Telegram/OpenClaw thread via API, enable quick commands.
6. **Polish & Ops:** Command palette, notification banners, dark mode toggle, deploy to production URL.

## Open Questions / Next Decisions
- Finalize visual identity (colors, typography) to match Nate’s preference.
- Determine preferred hosting accounts (use Henry-owned for now?).
- Confirm security posture requirements before integrating Apollo systems.
- Decide on telemetry/analytics (PostHog vs. simple logging) for future optimization.
