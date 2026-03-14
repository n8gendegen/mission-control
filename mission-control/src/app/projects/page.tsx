import { Sidebar } from "../../components/layout/Sidebar";
import { ProjectBoard } from "../../components/projects/ProjectBoard";

const CONCIERGE_PROJECT_SOURCE = "concierge-relaunch";

export const revalidate = 0;

export default function ProjectsPage() {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="flex flex-1 flex-col space-y-6 px-8 py-6">
        <header className="rounded-3xl border border-white/5 bg-[#0b0d12] p-6">
          <p className="text-xs uppercase tracking-[0.5em] text-white/40">Projects</p>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white">Concierge Relaunch</h1>
              <p className="text-sm text-white/60">
                Module 0–4 plan tracked as a dedicated kanban. Filtered via Supabase tasks where source =
                <span className="font-semibold text-white"> {CONCIERGE_PROJECT_SOURCE}</span>.
              </p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
              Source tag: <span className="font-semibold text-white">{CONCIERGE_PROJECT_SOURCE}</span>
            </div>
          </div>
        </header>
        <ProjectBoard projectSource={CONCIERGE_PROJECT_SOURCE} />
      </main>
    </div>
  );
}
