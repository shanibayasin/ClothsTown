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

  if (pathname === "/admin/login") {
    return <div className="admin-theme min-h-dvh">{children}</div>;
  }

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
            className="admin-backdrop-enter fixed inset-0 z-40 bg-primary/55 backdrop-blur-[2px] lg:hidden"
          />
          <aside className="admin-drawer-enter fixed inset-y-0 left-0 z-50 h-dvh w-[min(84vw,290px)] border-r border-white/10 shadow-2xl lg:hidden">
            <Sidebar closeSidebar={closeMobileSidebar} />
          </aside>
        </>
      )}

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
        <div className="shrink-0">
          <Header onMenuClick={() => setIsMobileSidebarOpen((open) => !open)} />
        </div>
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-350">{children}</div>
        </main>
      </div>
    </div>
  );
}