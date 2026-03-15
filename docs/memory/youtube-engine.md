# YouTube Content Engine Memory

## Pipeline Architecture
### Core Stages
1. **Idea Intake**
   - Manual entry → `content_ideas` table
   - Auto-assigned Spy agent for research
2. **Script Generation**
   - Agent: `youtube-followon.mjs` (Claude-3 Opus)
   - Output: `docs/youtube/scripts/<slug>.md`
3. **Asset Packaging**
   - Runner: `set-youtube-assets.mjs`
   - Stores in Supabase Storage bucket `youtube-drafts`
4. **Publishing**
   - Script: `youtube-publisher.mjs`
   - Auth: YouTube API JWT workflow

## Supabase Core Tables
- `tasks` (Extended fields):
  - `video_slug` (URL-safe ID)
  - `asset_links` (JSON: {"mp4": URL, "thumbnail": URL})
  - `youtube_video_id` (Post-publish)
  - `metrics` (JSON: views/likes updated hourly)

## Concrete Examples
### Sora Video Workflow
1. Idea: "AI video generation revolution"
2. Script: `SPY-22987` generated 12-page draft
3. Assets: MP4 + 3 thumbnail candidates
4. Published: YouTube ID `#KY4K7LpC3qM`

### AI Goalkeeper Video
- Current State: Stuck in packaging
- Blocker: Thumbnail validation failed
- Debug Log: `error: asset_links missing title card`

## Guardrails & Criteria
✅ **Acceptance Criteria Met**:
- 1 full e2e publish (Sora video)
- Manual approval step pre-publish
- JWT auth for all API calls

🚧 **TODOs**:
1. Finalize `content_ideas` schema
2. Implement quota management system
3. Metrics hydration from YouTube API
4. Asset validation pre-upload

---
*Rebuilt from task logs + Sora video implementation*