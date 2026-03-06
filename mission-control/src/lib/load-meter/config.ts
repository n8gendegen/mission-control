/**
 * Expose a Mission Control “load meter” card that rolls up active tasks/experiments into a simple availability score so Nate knows when the team can absorb new work.
 *
 * Definition of Done: Supabase view or RPC aggregates tasks by owner/status, computes story-point equivalents, and exposes an API that the UI tile consumes. Mission Control shows a load meter card with color-coded ranges (green/yellow/red) and textual guidance (“Steve has 2 tasks left, ETA 3 days”).
 */
export type AgentLoadSnapshot = {
  agent: string;
  points: number;
  etaDays: number;
  tasks: number;
};

export const LOAD_BANDS = {
  green: { max: 2 },
  yellow: { min: 3, max: 4 },
  red: { min: 5 }
} as const;

export function computeLoadBand(points: number) {
  if (points <= LOAD_BANDS.green.max) return "green";
  if (points >= LOAD_BANDS.red.min) return "red";
  return "yellow";
}

export function describeLoad(snapshot: AgentLoadSnapshot) {
  return "Data layer returns total active work, per-agent workload, and projected completion dates. => " + snapshot.agent + " has " + snapshot.points + " pts";
}