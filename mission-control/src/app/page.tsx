"use client";

const opportunities = [
  {
    id: "rev-1",
    title: "Wearable Data Clearinghouse",
    stage: "Active",
    owner: "Steve",
    estValue: 4500000,
    probability: 0.45,
    nextAction: "Draft integration pitch",
    nextDate: "Mar 04",
  },
  {
    id: "rev-2",
    title: "Treasury Risk Pulse",
    stage: "Idea",
    owner: "Henry",
    estValue: 1800000,
    probability: 0.30,
    nextAction: "Validate bank partner list",
    nextDate: "Mar 01",
  },
  {
    id: "rev-3",
    title: "AI Concierge Automations",
    stage: "Active",
    owner: "Agent Ops",
    estValue: 2600000,
    probability: 0.55,
    nextAction: "Finalize pricing tiers",
    nextDate: "Mar 06",
  },
];

const totalPipeline = opportunities.reduce((sum, opp) => sum + opp.estValue, 0);
const weightedPipeline = opportunities.reduce(
  (sum, opp) => sum + opp.estValue * opp.probability,
  0
);

function formatCurrency(value: number) {
  return `$${(value / 1_000_000).toFixed(2)}M`;
}

export default function Home() {
  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      <aside className="w-72 border-r border-white/10 bg-black/30 backdrop-blur-xl p-6 flex flex-col">
        <h1 className="text-sm font-semibold tracking-[0.3em] text-white/60">
          MISSION CONTROL
        </h1>
        <nav className="mt-6 space-y-2">
          <button className="w-full rounded-xl px-4 py-3 text-left text-white/50">
            💬 Chat
          </button>
          <button className="w-full rounded-xl bg-emerald-400/15 px-4 py-3 text-left font-semibold text-emerald-300 shadow-inner shadow-emerald-500/40">
            💹 Revenue Labs
          </button>
          <button className="w-full rounded-xl px-4 py-3 text-left text-white/50">
            🛠 Ops Board
          </button>
          <button className="w-full rounded-xl px-4 py-3 text-left text-white/50">
            📓 Agent Tasks
          </button>
        </nav>
        <div className="mt-auto text-sm text-white/60">
          Status: <span className="font-semibold text-emerald-300">Autonomous</span>
        </div>
      </aside>
      <main className="flex-1 overflow-hidden p-10">
        <header className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl shadow-black/40">
          <p className="text-sm uppercase tracking-[0.3em] text-white/50">Pipeline Summary</p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
              <p className="text-xs uppercase tracking-wide text-white/50">Total Pipeline</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {formatCurrency(totalPipeline)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
              <p className="text-xs uppercase tracking-wide text-white/50">Opportunities</p>
              <p className="mt-3 text-3xl font-semibold text-white">{opportunities.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
              <p className="text-xs uppercase tracking-wide text-white/50">Weighted Pipeline</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {formatCurrency(weightedPipeline)}
              </p>
            </div>
          </div>
        </header>
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Opportunities</h2>
            <button className="rounded-full border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-300/10">
              New opportunity
            </button>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {opportunities.map((opp) => (
              <article
                key={opp.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-black/30 shadow-lg"
              >
                <div className="mb-4 text-xs uppercase tracking-[0.4em] text-white/50">
                  {opp.stage}
                </div>
                <h3 className="text-lg font-semibold text-white">{opp.title}</h3>
                <p className="mt-1 text-sm text-white/60">Owner: {opp.owner}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-white/50">Est. Value</p>
                    <p className="text-lg font-semibold text-white">
                      {formatCurrency(opp.estValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/50">Probability</p>
                    <p className="text-lg font-semibold text-white">
                      {(opp.probability * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/80">
                  <p className="text-white/40">Next action</p>
                  <p className="font-semibold text-white">{opp.nextAction}</p>
                  <p className="text-white/50">Due {opp.nextDate}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
