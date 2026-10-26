"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, Menu, ChevronRight } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname() || "";

  // Main Page Titles Mapping
  const titles: Record<string, string> = {
    "/admin": "Dashboard",
    "/admin/products": "Products",
    "/admin/categories": "Categories",
    "/admin/collections": "Collections",
    "/admin/orders": "Orders",
    "/admin/customers": "Customers",
    "/admin/reviews": "Reviews",
    "/admin/settings": "Settings",
  };

  const pageTitle = titles[pathname] || "Admin Panel";

  // Dynamic Breadcrumbs Generation Logic
  const segments = pathname.split("/").filter(Boolean);
  
  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    
    // Formatting: "-" ko space se replace karna aur Title Case banana
    const formattedName = segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

    return {
      name: segment === "admin" ? "Dashboard" : formattedName,
      href,
    };
  });

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 shadow-soft md:h-20 md:px-8">
      
      {/* LEFT SIDE: LOGO/MENU & TITLE WITH BREADCRUMBS */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Toggle navigation menu"
          className="rounded-control border border-border p-2 transition-colors hover:bg-section lg:hidden"
        >
          <Menu size={20} className="text-muted" />
        </button>

        <div>
          <h1 className="text-xl font-bold tracking-tight text-primary md:text-2xl">
            {pageTitle}
          </h1>

          {/* Clean Dynamic Breadcrumbs Wrapper */}
          <nav className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted">
            <Link href="/admin" className="hover:text-primary transition-colors">
              Home
            </Link>

            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;

              // Agar path "/admin" hai, toh usko "Home" ke sath duplicate nahi dikhayenge
              if (item.href === "/admin") return null;

              return (
                <div key={item.href} className="flex items-center gap-1.5">
                  <ChevronRight size={12} className="text-border" />
                  
                  {isLast ? (
                    // Last/Current Page link nahi hoga aur iska color dark hoga
                    <span className="font-semibold text-text selection:bg-transparent">
                      {item.name}
                    </span>
                  ) : (
                    // Parent pages clickable honge aapke brand color hover effect ke sath
                    <Link
                      href={item.href}
                      className="hover:text-primary hover:underline decoration-1 transition-colors"
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* RIGHT SIDE: SEARCH, NOTIFICATIONS & ADMIN PROFILE */}
      <div className="flex items-center gap-3">
        
        {/* Search Action */}
        <button className="flex h-10 w-10 items-center justify-center rounded-control border border-border text-muted transition-colors hover:bg-section">
          <Search size={18} />
        </button>

        {/* Notifications Trigger */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-control border border-border text-muted transition-colors hover:bg-section">
          <Bell size={18} />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 animate-pulse rounded-full bg-secondary"></span>
        </button>

        <div className="mx-1 hidden h-8 w-px bg-border md:block"></div>

        {/* Identity / User Session Control */}
        <div className="flex items-center gap-3 select-none">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-semibold text-sm shadow-inner">
            A
          </div>

          <div className="hidden md:block leading-tight">
            <h4 className="text-sm font-semibold text-text">
              Admin
            </h4>
            <p className="text-[11px] font-medium text-muted">
              Administrator
            </p>
          </div>
        </div>

      </div>

    </header>
  );
}