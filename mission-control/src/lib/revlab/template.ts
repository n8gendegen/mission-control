/**
 * Create a standardized Revenue Lab experiment template schema documenting key fields for backlog management.
 *
 * Definition of Done: A documented schema for the Revenue Lab experiment template is created, including the fields hypothesis, channel, EV, effort, owner, and status. The schema is reviewed and approved by stakeholders and integrated into the backlog system documentation.
 */
export type ExperimentTemplate = {
  name: string;
  hypothesis: string;
  metric: string;
  owner: string;
  notes: string;
};

export function createExperimentTemplate(): ExperimentTemplate {
  throw new Error('Define Revenue Lab experiment template per splitter spec');
}
