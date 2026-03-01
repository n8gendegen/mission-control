import type { TaskColumn, TaskRecord } from "../../lib/data/types";
import { TaskCard } from "./TaskCard";

type ColumnProps = {
  columnId: TaskColumn;
  title: string;
  count: number;
  tasks: TaskRecord[];
  onMoveTask: (taskId: string, column: TaskColumn) => void;
};

export function Column({ columnId, title, count, tasks, onMoveTask }: ColumnProps) {
  return (
    <div className="flex min-w-[280px] flex-1 flex-col space-y-4 rounded-3xl border border-white/5 bg-[#0b0f16] p-5">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/40">
        <span>{title}</span>
        <span>{count}</span>
      </div>
      <div className="space-y-4">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onMoveTask={onMoveTask} />
        ))}
      </div>
    </div>
  );
}
