# How to Add a New YouTube Video (Mission Control)

## Prereqs
- Env secrets already set in GitHub/Vercel/local: `SUPABASE_DB_URL`, `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`.
- Draft MP4 + thumbnail placed in Supabase Storage bucket `youtube-drafts/` (e.g., `youtube-drafts/yt-<slug>.mp4`, `youtube-drafts/yt-<slug>-thumb.jpg`).

## Steps
1. **Create an idea task** (Supabase → `tasks` table or future UI):
   - `project='youtube-content-engine'`
   - `lane='ideas'`
   - `video_slug='your-slug-here'` (lowercase, hyphenated)
   - Title/description = the hook you want to see in `/content`.
2. **Let auto-assign + runners work:**
   - `worker:auto-assign` (GitHub Action) will spawn Script/Assets/Packaging/Publish tasks with the right owners + statuses.
   - `scripts/youtube-conveyor.mjs` auto-completes the intermediate lanes using our default metadata.
3. **Watch progress in `/content`:**
   - `/content` shows the pipeline (Ideas → Script → Assets → Ship). Cards move automatically as lanes complete.
4. **Override assets (optional):**
   - Upload your draft MP4 + thumbnail to `https://dzmtdzfkhtnryhpkwfcd.supabase.co/storage/v1/object/public/youtube-drafts/`.
   - Add the slug + URLs to `scripts/set-youtube-assets.mjs` and run:
     ```bash
     SUPABASE_DB_URL=… node scripts/set-youtube-assets.mjs <video_slug>
     ```
     This updates the Assets/Packaging/Publish tasks’ `asset_links` (no manual SQL).
5. **Publish via the runner:**
   - When you’re ready, run:
     ```bash
     SUPABASE_DB_URL=… \
     YOUTUBE_CLIENT_ID=… YOUTUBE_CLIENT_SECRET=… YOUTUBE_REFRESH_TOKEN=… \
     node scripts/youtube-publisher.mjs task-yt-publish-<slug>
     ```
   - The runner uploads the MP4 (unlisted), sets `youtube_video_id` + `youtube_url`, and logs a `video_published` event.

## Where to find the final video
- Supabase `tasks` row (Publish lane) → `youtube_video_id` + `youtube_url` columns.
- `/content` Ship column shows **Preview** (Supabase draft) and **YouTube** buttons once the runner finishes.
