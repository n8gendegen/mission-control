/**
 * Nightly worker ingests Reuters Tech, SEC 8-K, and chip-supply advisories, normalizes them, and tags affected Mission Control lanes.
 *
 * Definition of Done: Supabase Edge Function (or cron job) fetches each feed nightly, dedupes items, stores them in ai_wire_tap_events, and inserts an alert row per impacted lane with metadata (source, headline, summary, affected assets). Configuration lives in Supabase so we can add/remove feeds without redeploying.
 */
export type AiWireTapEvent = {
  source: string;
  title: string;
  link: string;
  publishedAt: string;
  summary: string;
  affectedLanes: string[];
  raw: Record<string, unknown>;
};

export const AI_WIRE_TAP_SOURCES = [
  "Reuters Tech RSS",
  "SEC 8-K search API",
  "Chip advisory RSS"
];

export function createAiWireTapEvent(event: AiWireTapEvent) {
  // TODO: Define ai_wire_tap_events table + RPC for inserting alerts.
  return event;
}
