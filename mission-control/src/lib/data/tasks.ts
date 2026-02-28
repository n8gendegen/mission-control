import tasksData from "../../../data/tasks.json";
import type { TaskColumn, TaskRecord } from "./types";

type ColumnMap = Record<TaskColumn, TaskRecord[]>;

const tasks = tasksData as TaskRecord[];

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
