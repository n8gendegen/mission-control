type ColumnConfig = {
  id: string;
  title: string;
  count: number;
};

const columns: ColumnConfig[] = [
  { id: "backlog", title: "Backlog", count: 4 },
  { id: "in-progress", title: "In Progress", count: 3 },
  { id: "rev", title: "Rev", count: 2 },
];

export function BoardShell() {
  return (
    <section className="flex flex-1 gap-5">
      {columns.map((col) => (
        <div
          key={col.id}
          className="flex-1 rounded-3xl border border-white/5 bg-[#0c0f17] p-4"
        >
          <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/40">
            <span>{col.title}</span>
            <span>{col.count}</span>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((slot) => (
              <div
                key={`${col.id}-${slot}`}
                className="h-24 rounded-2xl border border-dashed border-white/10 bg-white/5"
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
