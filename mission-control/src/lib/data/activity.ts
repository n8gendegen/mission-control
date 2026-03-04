import type { ActivityLogEntry } from "../activity/logActivity";
import { fetchRecentActivity } from "../activity/logActivity";

export async function getActivityFeed(limit = 25): Promise<ActivityLogEntry[]> {
  return fetchRecentActivity(limit);
}
