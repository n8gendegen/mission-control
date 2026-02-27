import { ActivityPanel } from "../components/activity/ActivityPanel";
import { BoardShell } from "../components/board/BoardShell";
import { Sidebar } from "../components/layout/Sidebar";
import { TopBar } from "../components/layout/TopBar";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#05060b] text-white/80">
      <Sidebar />
      <div className="ml-[240px] flex min-h-screen gap-8 px-10 py-8">
        <div className="flex flex-1 flex-col gap-6">
          <TopBar />
          <BoardShell />
        </div>
        <div className="w-[320px]">
          <ActivityPanel />
        </div>
      </div>
    </div>
  );
}
