/**
 * Implement a week-view calendar UI in the Calendar tab that displays static cron job schedules by expanding their cron expressions into this week's time slots.
 *
 * Definition of Done: The Calendar tab includes a new week-view calendar that visually displays all predefined static cron jobs. Cron expressions are correctly parsed and expanded to show scheduled occurrences within the current week. The UI is responsive and matches the existing design language. The feature is tested with multiple cron expressions and verified for accuracy and usability.
 */
export type CronJob = {
  id: string;
  label: string;
  cron: string;
  lane: string;
};

export const STATIC_CRON_JOBS: CronJob[] = [];

export function expandCron(job: CronJob): Date[] {
  throw new Error('Add cron expansion helper per splitter spec');
}
