import activityData from "../../../data/activity.json";
import type { ActivityRecord } from "./types";

const activity = activityData as ActivityRecord[];

export function getActivityFeed(): ActivityRecord[] {
  return activity;
}
