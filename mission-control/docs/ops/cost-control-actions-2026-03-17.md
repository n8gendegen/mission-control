# Cost-Control Actions – 17 Mar 2026

1. **Auto-assign cache** – store prior summaries keyed by slug to avoid refiring Minimax (`scripts/auto-assign-tasks.mjs`).
2. **Concierge routing** – config snippet to force Minimax default with GPT fallback for escalations.
3. **Spy embeddings** – reuse `text-embedding-3-small` vectors for repeated connector pulls.

Each item includes owner, ETA, and expected savings.
