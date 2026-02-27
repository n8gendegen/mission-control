export function BoardShell() {
  const columns = [
    { title: "Backlog", count: 4 },
    { title: "In Progress", count: 3 },
    { title: "Rev", count: 2 },
  ];

  return (
    <div className="flex flex-1 gap-6">
      {columns.map((col) => (
        <div
          key={col.title}
          className="flex-1 rounded-3xl border border-white/5 bg-white/5 p-4 text-white/70"
        >
          <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/40">
            <span>
              {col.title} {col.count}
            </span>
          </div>
          <div className="grid gap-3">
            {[1, 2, 3].map((card) => (
              <div
                key={card}
                className="h-24 rounded-2xl border border-dashed border-white/10 bg-white/5"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
