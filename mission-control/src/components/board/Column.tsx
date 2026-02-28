import type { Task } from "../../../data/tasks";
import { TaskCard } from "./TaskCard";

type ColumnProps = {
  title: string;
  count: number;
  tasks: Task[];
};

export function Column({ title, count, tasks }: ColumnProps) {
  return (
    <div className="flex-1 rounded-3xl border border-white/5 bg-[#0b0f16] p-5">
      <div className="mb-5 flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/40">
        <span>{title}</span>
        <span>{count}</span>
      </div>
      <div className="space-y-4">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
