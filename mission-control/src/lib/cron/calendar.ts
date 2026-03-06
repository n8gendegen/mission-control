import parser from "cron-parser";

/**
 * Implements helpers for rendering a week-view calendar of static cron jobs.
 */
export type CronJob = {
  id: string;
  label: string;
  cron: string;
  lane: string;
  description?: string;
};

export type CronOccurrence = {
  job: CronJob;
  runAt: Date;
};

const DEFAULT_CRON_TZ = process.env.CRON_TIMEZONE ?? "America/New_York";

export const STATIC_CRON_JOBS: CronJob[] = [
  {
    id: "alert-inbox-refresh",
    label: "Alert Inbox refresh",
    cron: "*/15 * * * *",
    lane: "alerts",
    description: "Pull stuck dispatch rows + automation health warnings",
  },
  {
    id: "builder-sweep",
    label: "Builder spec sweep",
    cron: "5 * * * *",
    lane: "builder",
    description: "Check for new splitter specs and queue harness runs",
  },
  {
    id: "spy-claims",
    label: "Spy claims ingest",
    cron: "0 6 * * *",
    lane: "spy",
    description: "Fetch bounty/code-fix sources every morning",
  },
  {
    id: "approval-digest",
    label: "Approvals digest",
    cron: "30 13 * * 1-5",
    lane: "approvals",
    description: "Summarize pending approvals on weekdays at 8:30a ET",
  },
  {
    id: "auto-assign-health",
    label: "Auto-assign health check",
    cron: "0 */6 * * *",
    lane: "ops",
    description: "Verify the agent dispatch queue is flowing every 6h",
  },
];

function getWeekWindow(reference = new Date()) {
  const start = new Date(reference);
  start.setUTCHours(0, 0, 0, 0);
  const day = start.getUTCDay();
  const diffFromMonday = (day + 6) % 7;
  start.setUTCDate(start.getUTCDate() - diffFromMonday);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  return { start, end };
}

export function expandCron(job: CronJob, reference?: Date): Date[] {
  const { start, end } = getWeekWindow(reference);
  try {
    const interval = parser.parseExpression(job.cron, {
      currentDate: start,
      tz: DEFAULT_CRON_TZ,
    });
    const occurrences: Date[] = [];
    while (true) {
      const next = interval.next().toDate();
      if (next >= end) {
        break;
      }
      occurrences.push(next);
    }
    return occurrences;
  } catch (err) {
    console.warn(`Failed to expand cron for ${job.id}:`, err);
    return [];
  }
}

export function getWeekSchedule(reference = new Date(), jobs: CronJob[] = STATIC_CRON_JOBS): CronOccurrence[] {
  return jobs.flatMap((job) => expandCron(job, reference).map((runAt) => ({ job, runAt })));
}
