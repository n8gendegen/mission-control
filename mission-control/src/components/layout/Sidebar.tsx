export function Sidebar() {
  const items = [
    { label: "Chat", description: "Converse with agents." },
    { label: "Revenue Labs", description: "Monetization experiments." },
    { label: "Ops Board", description: "Execution lanes." },
    { label: "Agent Tasks", description: "Playbooks + notes." },
    { label: "Data Usage", description: "Model spend + usage." },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] bg-[#0f0f13] border-r border-white/10 text-white/80 p-6 space-y-4">
      <div className="text-xs tracking-[0.4em] text-white/40">MISSION CONTROL</div>
      <nav className="flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3"
          >
            <div className="text-sm font-semibold text-white">{item.label}</div>
            <div className="text-xs text-white/50">{item.description}</div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
