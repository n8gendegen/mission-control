const NAV_ITEMS = [
  "Tasks",
  "Content",
  "Approvals",
  "Council",
  "Calendar",
  "Projects",
  "Memory",
  "Docs",
  "People",
  "Office",
  "Team",
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 flex h-screen w-[240px] flex-col justify-between border-r border-white/10 bg-[#0b0c10] p-6 text-white/70">
      <div>
        <div className="text-xs font-semibold tracking-[0.4em] text-white/40">
          MISSION CONTROL
        </div>
        <nav className="mt-6 space-y-2">
          {NAV_ITEMS.map((item, idx) => {
            const active = idx === 0;
            return (
              <div
                key={item}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                  active
                    ? "border-violet-400/60 bg-violet-400/15 text-white"
                    : "border-white/5 bg-white/5 text-white/60 hover:border-white/25"
                }`}
              >
                <span>{item}</span>
                {active && <span className="text-xs text-violet-300">•</span>}
              </div>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-3 text-sm text-white/60">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
          N
        </div>
        <div>
          <p className="font-semibold text-white">Nate</p>
          <p className="text-xs text-white/40">Operator</p>
        </div>
      </div>
    </aside>
  );
}
