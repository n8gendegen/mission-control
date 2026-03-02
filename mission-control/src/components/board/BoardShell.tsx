"use client";

import { useEffect, useMemo, useState } from "react";
import type { TaskColumn, TaskRecord } from "../../lib/data/types";
import { supabase } from "../../lib/supabase/client";
import { Column } from "./Column";

type ColumnConfig = {
  id: TaskColumn;
  title: string;
};

type TaskRow = {
  id: string;
  slug: string | null;
  column_id: TaskColumn;
  title: string;
  description: string | null;
  status_color: string | null;
  owner_initials: string | null;
  source: string | null;
  updated_at: string | null;
  created_at: string | null;
};

const columns: ColumnConfig[] = [
  { id: "backlog", title: "Backlog" },
  { id: "in-progress", title: "In Progress" },
  { id: "rev", title: "Completed" },
];

function formatRelativeTime(timestamp?: string | null) {
  if (!timestamp) {
    return "just now";
  }
  const deltaMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.max(Math.floor(deltaMs / 60000), 0);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function mapRowToTask(row: TaskRow): TaskRecord {
  return {
    id: row.slug ?? row.id,
    rowId: row.id,
    column: row.column_id ?? "backlog",
    title: row.title,
    description: row.description ?? "",
    statusColor: row.status_color ?? "bg-slate-500",
    ownerInitials: row.owner_initials ?? "--",
    source: row.source ?? "Mission Control",
    timeAgo: formatRelativeTime(row.updated_at ?? row.created_at),
  };
}

export function BoardShell() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchTasks() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select(
          "id,slug,title,description,column_id,status_color,owner_initials,source,updated_at,created_at"
        )
        .order("created_at", { ascending: true });

      if (!isMounted) return;

      if (error) {
        console.error("Failed to load tasks from Supabase", error);
        setError("Unable to load tasks");
        setTasks([]);
      } else {
        setError(null);
        setTasks((data ?? []).map(mapRowToTask));
      }
      setIsLoading(false);
    }

    fetchTasks();

    return () => {
      isMounted = false;
    };
  }, []);

  const tasksByColumn = useMemo(() => {
    return tasks.reduce<Record<TaskColumn, TaskRecord[]>>(
      (acc, task) => {
        acc[task.column].push(task);
        return acc;
      },
      { backlog: [], "in-progress": [], rev: [] }
    );
  }, [tasks]);

  const handleMoveTask = async (taskId: string, column: TaskColumn) => {
    const previousTasks = tasks;
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              column,
              timeAgo: "just now",
            }
          : task
      )
    );

    const targetRowId = previousTasks.find((task) => task.id === taskId)?.rowId;

    if (!targetRowId) {
      console.error("Task rowId missing; cannot update Supabase");
      return;
    }

    const { error } = await supabase
      .from("tasks")
      .update({ column_id: column, updated_at: new Date().toISOString() })
      .eq("id", targetRowId);

    if (error) {
      console.error("Unable to update task column", error);
      setTasks(previousTasks);
    }
  };

  if (isLoading) {
    return (
      <section className="flex flex-1 items-start gap-6">
        {columns.map((col) => (
          <div
            key={col.id}
            className="flex min-w-[280px] flex-1 flex-col space-y-4 rounded-3xl border border-white/5 bg-[#0b0f16] p-5"
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/40">
              <span>{col.title}</span>
              <span>…</span>
            </div>
            <div className="space-y-4">
              <div className="h-24 rounded-2xl border border-white/5 bg-white/5 animate-pulse" />
              <div className="h-24 rounded-2xl border border-white/5 bg-white/5 animate-pulse" />
            </div>
          </div>
        ))}
      </section>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#1b1e2b] p-6 text-sm text-rose-200">
        {error}. Please refresh or check Supabase connectivity.
      </div>
    );
  }

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
