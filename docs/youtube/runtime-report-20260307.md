# YouTube Runtime Report — 2026-03-07

## Summary
- **Date:** 2026-03-07
- **Supabase project:** `dzmtdzfkhtnryhpkwfcd`
- **Repo / branch:** `n8gendegen/mission-control` @ `main`
- **Videos processed today:**
  - `sora-breaks-hollywood` (Sora vs Hollywood)
  - `ai-directors-union` (AI Directors vs Unions)

## Workflows / Runners
| Name / Path | Trigger | Lanes Touched |
| --- | --- | --- |
| `.github/workflows/auto-assign.yml` (worker:auto-assign → agent dispatcher → Splitter → builder session) | GitHub Actions cron `0 * * * *` or manual dispatch | ideas → script → assets → packaging → publish (creates follow-on tasks + auto-completes script/assets/packaging) |
| `scripts/youtube-conveyor.mjs` | Called inside auto-assign workflow | script → assets → packaging → publish (ensures downstream tasks + default metadata) |
| `scripts/set-youtube-assets.mjs` | Manual CLI when a video slug needs asset_links | assets → packaging → publish (writes Supabase Draft MP4 + Thumbnail links) |
| `scripts/youtube-publisher.mjs` | Manual CLI (env-driven) | publish (uploads MP4 to YouTube, sets `youtube_video_id` + `youtube_url`, logs Live Activity) |

## Today’s lane throughput
| Lane | # tasks touched | Example slugs |
| --- | --- | --- |
| Ideas | 4 | `task-yt-idea-sora`, `task-yt-idea-ai-directors` |
| Script | 4 | `task-yt-script-sora`, `task-yt-script-ai-directors` |
| Assets | 4 | `task-yt-assets-sora`, `task-yt-assets-ai-directors` |
| Packaging | 4 | `task-yt-packaging-sora`, `task-yt-packaging-ai-directors` |
| Publish | 2 (pushed to YouTube), 2 queued | `task-yt-publish-sora`, `task-yt-publish-ai-directors` (credit-runs + fed-minutes remain scheduled) |

## Events & Issues
- **Live Activity events:**
  - `video_published` for `task-yt-publish-sora` (ID `GkLkbShTE1k`).
  - `video_published` for `task-yt-publish-ai-directors` (ID `Mel9wSTc1AE`).
  - `video_thumbnail_failed` (x2) — YouTube API rejected custom thumbnails because the channel lacks the “custom thumbnail” permission.
- **Known issues / follow-ups:**
  - *YouTube thumbnail 403*: request custom-thumbnail access for the channel, or skip `thumbnails.set` when the permission isn’t granted (current runner already logs + continues; no user impact).
