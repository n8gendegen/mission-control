import tasksData from "../../../data/tasks.json";
import type { TaskColumn, TaskRecord } from "./types";
import { determineStageFromTask } from "./taskStages";

type ColumnMap = Record<TaskColumn, TaskRecord[]>;

const tasks: TaskRecord[] = (tasksData as Array<Record<string, any>>).map((task) => {
  const stage = determineStageFromTask({ ownerInitials: task.ownerInitials, columnId: task.column });
  return {
    ...task,
    stageKey: stage.key,
    stageLabel: stage.label,
    stageShortLabel: stage.shortLabel,
    stageBadgeClass: stage.badgeClass,
  } as TaskRecord;
});

const grouped: ColumnMap = tasks.reduce<ColumnMap>(
  (acc, task) => {
    acc[task.column].push(task);
    return acc;
  },
  {
    backlog: [],
    "in-progress": [],
    rev: [],
  }
);

export function getAllTasks(): TaskRecord[] {
  return tasks;
}

export function getTasksByColumn(column: TaskColumn): TaskRecord[] {
  return grouped[column];
}

export function getColumnMap(): ColumnMap {
  return grouped;
}
