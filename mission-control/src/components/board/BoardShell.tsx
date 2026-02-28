import { getColumnMap } from "../../lib/data/tasks";
import type { TaskColumn } from "../../lib/data/types";
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

const tasksByColumn = getColumnMap();

export function BoardShell() {
  return (
    <section className="flex flex-1 items-start gap-6">
      {columns.map((col) => {
        const columnTasks = tasksByColumn[col.id];
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
