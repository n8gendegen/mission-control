const metrics = [
  { label: "This week", value: "3", accent: "text-emerald-300" },
  { label: "In progress", value: "3", accent: "text-sky-300" },
  { label: "Total", value: "25", accent: "text-orange-300" },
  { label: "Completion", value: "40%", accent: "text-violet-300" },
];

export function TopBar() {
  return (
    <header className="rounded-3xl border border-white/5 bg-[#0b0d12] p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-white/40">Tasks</p>
          <h1 className="text-2xl font-semibold text-white">Mission Control</h1>
        </div>
        <div className="flex gap-4">
          <button className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
            Pause
          </button>
          <button className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
            Ping Henry
          </button>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/50">
            Search…
          </div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-white/5 bg-[#11131a] px-4 py-3"
          >
            <p className={`text-3xl font-semibold ${metric.accent}`}>{metric.value}</p>
            <p className="text-xs uppercase tracking-[0.4em] text-white/40">{metric.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <button className="rounded-full bg-violet-500 px-5 py-3 text-sm font-semibold text-white shadow shadow-violet-500/40">
          + New task
        </button>
        <div className="flex items-center gap-3 text-sm text-white/60">
          <div className="flex gap-2">
            {['Alex', 'Henry'].map((person) => (
              <span
                key={person}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs"
              >
                {person}
              </span>
            ))}
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
            All projects
          </div>
        </div>
      </div>
    </header>
  );
}
