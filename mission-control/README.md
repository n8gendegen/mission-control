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
