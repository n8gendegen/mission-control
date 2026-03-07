# Blocker Report — Sora vs Hollywood (Publish stage)

1. **Missing secrets:** `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, and `YOUTUBE_REFRESH_TOKEN` are not configured in `.env.local`, the repo, or 1Password (searched workspace + env vars at 21:45 ET).
2. **Command attempted:** `SUPABASE_DB_URL=… node mission-control/scripts/youtube-publisher.mjs task-yt-publish-sora` — script aborts immediately because the required YouTube credentials are undefined.
3. **Current task state:** `task-yt-publish-sora` remains in the publish lane with no `youtube_video_id` stored; packaging metadata is ready via `docs/youtube/yt-packaging-sora.md`.
4. **What’s already tried:** Verified env files (`.env.local`, repo root), searched for existing Google API keys, and confirmed no stored OAuth tokens; validated that Supabase logging works so we can record the block.
5. **Next steps once secrets exist:** add the three env vars to CI + LaunchAgent, authorize the YouTube uploader via OAuth to get a refresh token, then rerun `scripts/youtube-publisher.mjs` to perform the actual upload and write the resulting `youtube_video_id` back to Supabase.

_Logged to Live Activity as `video_schedule_blocked` so the conveyor belt shows why the publish step is paused._
