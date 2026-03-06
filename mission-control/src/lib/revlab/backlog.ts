/**
 * Create an initial backlog of at least 5 scored Revenue Lab experiments, including topics such as pricing, YouTube funnel, AI spend dashboard, and bounty automations.
 *
 * Definition of Done: A backlog containing at least 5 experiments is created and scored. Each experiment includes a clear title, description, scoring criteria, and relevant tags. The backlog is documented and shared with the Revenue Lab team for review.
 */
export type ExperimentBacklogItem = {
  id: string;
  templateId: string;
  priority: number;
  etaWeeks: number;
};

export function seedExperimentBacklog(): ExperimentBacklogItem[] {
  return []; // TODO: hydrate from Supabase per spec
}
