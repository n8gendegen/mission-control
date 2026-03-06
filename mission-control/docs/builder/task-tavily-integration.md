# Add Tavily search support

## Summary
Centralize Tavily usage so every research workflow (Spy, Splitter, dashboards) pulls from the same cached helper and the API key lives in Supabase.

## Definition of Done
Tavily API key stored in Supabase secrets, server-side helper wraps tavily search, and Spy/other runners call the helper (no direct Brave calls). Includes rate limiting + caching toggle.

## Acceptance Criteria
- Supabase secret or key-value table stores tavily_api_key and is readable by server-side code only.
- New helper (lib/tavily.ts) exposes search + extract functions with typed responses.
- Spy CLI + upcoming runners call the helper and honor a configurable cache TTL.
- Mission Control data tab can show remaining Tavily quota / usage from helper metadata.

## Handoff Actions
1. Add tavily_api_key to Supabase config + GitHub Actions secrets.
2. Implement lib/tavily.ts with search(url, options) + summarize helpers.
3. Refactor spy-claims/spy-scan (and any other Brave usage) to call Tavily helper.
4. Add metrics logging (request count, last error) to agent_health_status metadata.
5. Document usage and fallback behavior (if Tavily fails, default to Brave + alert).
