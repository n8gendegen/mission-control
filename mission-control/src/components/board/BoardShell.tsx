"use client";

import { useMemo, useState } from "react";
import { getAllTasks } from "../../lib/data/tasks";
import type { TaskColumn, TaskRecord } from "../../lib/data/types";
import { Column } from "./Column";

type ColumnConfig = {
  id: TaskColumn;
  title: string;
};

const columns: ColumnConfig[] = [
  { id: "backlog", title: "Backlog" },
  { id: "in-progress", title: "In Progress" },
  { id: "rev", title: "Rev" },
];

const initialTasks = getAllTasks();

export function BoardShell() {
  const [tasks, setTasks] = useState<TaskRecord[]>(initialTasks);

  const tasksByColumn = useMemo(() => {
    return tasks.reduce<Record<TaskColumn, TaskRecord[]>>(
      (acc, task) => {
        acc[task.column].push(task);
        return acc;
      },
      { backlog: [], "in-progress": [], rev: [] }
    );
  }, [tasks]);

  const handleMoveTask = (taskId: string, column: TaskColumn) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              column,
            }
          : task
      )
    );
  };

  return (
    <section className="flex flex-1 items-start gap-6">
      {columns.map((col) => {
        const columnTasks = tasksByColumn[col.id];
        return (
          <Column
            key={col.id}
            columnId={col.id}
            title={col.title}
            count={columnTasks.length}
            tasks={columnTasks}
            onMoveTask={handleMoveTask}
          />
        );
      })}
    </section>
  );
}
