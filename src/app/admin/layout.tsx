"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

  if (pathname === "/admin/login") return children;

  return (
    <div className="admin-theme flex h-dvh min-h-0 overflow-hidden bg-background">
      <aside className="sticky top-0 hidden h-dvh w-[216px] shrink-0 lg:block">
        <Sidebar />
      </aside>

      {isMobileSidebarOpen && (
        <>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={closeMobileSidebar}
            className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          />
          <aside className="fixed inset-y-0 left-0 z-50 h-dvh w-[min(82vw,280px)] shadow-2xl lg:hidden">
            <Sidebar closeSidebar={closeMobileSidebar} />
          </aside>
        </>
      )}

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
        <div className="shrink-0">
          <Header onMenuClick={() => setIsMobileSidebarOpen((open) => !open)} />
        </div>
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-350">{children}</div>
        </main>
      </div>
    </div>
  );
}