export function ActivityPanel() {
  return (
    <aside className="w-[320px] rounded-3xl border border-white/5 bg-white/5 p-4 text-white/70">
      <div className="text-xs uppercase tracking-[0.3em] text-white/40">Live Activity</div>
      <div className="mt-4 space-y-3">
        {[1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-white/5 bg-[#14141b] p-3 text-sm"
          >
            <div className="flex items-center justify-between text-xs text-white/40">
              <span>Henry</span>
              <span>just now</span>
            </div>
            <p className="mt-2 text-white/80">Placeholder activity #{item}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}
