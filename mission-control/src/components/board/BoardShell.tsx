import { tasks } from "../../../data/tasks";
import { Column } from "./Column";

type ColumnConfig = {
  id: "backlog" | "in-progress" | "rev";
  title: string;
};

const columns: ColumnConfig[] = [
  { id: "backlog", title: "Backlog" },
  { id: "in-progress", title: "In Progress" },
  { id: "rev", title: "Rev" },
];

export function BoardShell() {
  return (
    <section className="flex flex-1 items-start gap-6">
      {columns.map((col) => {
        const columnTasks = tasks.filter((task) => task.column === col.id);
        return (
          <Column
            key={col.id}
            title={col.title}
            count={columnTasks.length}
            tasks={columnTasks}
          />
        );
      })}
    </section>
  );
}
