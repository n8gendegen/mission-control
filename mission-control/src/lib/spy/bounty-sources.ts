/**
 * Identify and list 2 to 4 relevant bounty or code-fix marketplaces or repositories that align with TypeScript, Next.js, and AI skills, including appropriate filters to match payout targets.
 *
 * Definition of Done: A documented list of 2 to 4 marketplaces or repositories is created, each with specified filters that align with TypeScript, Next.js, and AI skill requirements and payout expectations. The list is reviewed and approved by the product team.
 */
export type BountySource = {
  name: string;
  url: string;
  filter: string;
  cadence: string;
};

export function listBountySources(): BountySource[] {
  return []; // TODO: hydrate with scraper output per spec
}
