import { ApprovalsBoard } from "../../components/approvals/ApprovalsBoard";
import { Sidebar } from "../../components/layout/Sidebar";

export default function ApprovalsPage() {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="flex flex-1 flex-col space-y-6 px-8 py-6">
        <header className="rounded-3xl border border-white/5 bg-[#0b0d12] p-6 text-white">
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.5em] text-white/40">Approvals</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">Mission Control Approvals</h1>
              <p className="mt-2 text-sm text-white/60">
                Review bounty proposals, confirm ROI, and approve or skip before implementation starts.
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#11131a] px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.4em] text-white/40">Policy</p>
              <p className="text-sm text-white/70">Nothing ships without approval</p>
            </div>
          </div>
        </header>
        <ApprovalsBoard />
      </main>
    </div>
  );
}
