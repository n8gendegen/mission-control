import { ActivityPanel } from "../components/activity/ActivityPanel";
import { BoardShell } from "../components/board/BoardShell";
import { Sidebar } from "../components/layout/Sidebar";
import { TopBar } from "../components/layout/TopBar";

export const revalidate = 0;

export default function Home() {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="flex flex-1 flex-col space-y-6 px-8 py-6">
        <TopBar />
        <section className="flex items-start gap-6">
          <BoardShell />
          <ActivityPanel />
        </section>
      </main>
    </div>
  );
}
