/**
 * Centralize Tavily usage so every research workflow (Spy, Splitter, dashboards) pulls from the same cached helper and the API key lives in Supabase.
 *
 * Definition of Done: Tavily API key stored in Supabase secrets, server-side helper wraps tavily search, and Spy/other runners call the helper (no direct Brave calls). Includes rate limiting + caching toggle.
 */
export type TavilySearchOptions = {
  focus?: "news" | "finance" | "general";
  maxResults?: number;
};

export async function tavilySearch(query: string, opts: TavilySearchOptions = {}) {
  throw new Error('Wire Tavily helper per spec: store API key in Supabase and add caching');
}
