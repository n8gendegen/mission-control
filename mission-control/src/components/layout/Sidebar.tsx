"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href?: Route;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Tasks", href: "/" },
  { label: "Data", href: "/data" },
  { label: "Content", href: "/content" },
  { label: "Approvals", href: "/approvals" },
  { label: "Council" },
  { label: "Calendar" },
  { label: "Projects" },
  { label: "Memory" },
  { label: "Docs" },
  { label: "People" },
  { label: "Office" },
  { label: "Team" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-shrink-0 flex-col justify-between border-r border-white/10 bg-[#0b0c10] p-6 text-white/70">
      <div>
        <div className="text-xs font-semibold tracking-[0.4em] text-white/40">
          MISSION CONTROL
        </div>
        <nav className="mt-6 space-y-2">
          {NAV_ITEMS.map((item) => {
            const active = item.href ? pathname === item.href : false;
            const baseClasses = "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition";
            const activeClasses = active
              ? "border-violet-400/60 bg-violet-400/15 text-white"
              : "border-white/5 bg-white/5 text-white/60 hover:border-white/25";

            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href as Route}
                  className={`${baseClasses} ${activeClasses}`}
                >
                  <span>{item.label}</span>
                  {active && <span className="text-xs text-violet-300">•</span>}
                </Link>
              );
            }

            return (
              <div key={item.label} className={`${baseClasses} border-white/5 bg-white/5 text-white/40`}>
                <span>{item.label}</span>
                <span className="text-xs text-white/30">Soon</span>
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
