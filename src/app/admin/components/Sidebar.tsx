"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Shapes,
  Image as ImageIcon,
  ShoppingCart,
  Users,
  Star,
  Settings,
  LogOut,
  LayoutGrid,
  Shirt,
  Sparkles,
  Gem,
} from "lucide-react";

const menus = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Collections", href: "/admin/collections", icon: LayoutGrid },
  { title: "Products", href: "/admin/products", icon: Package },
  { title: "Men", href: "/admin/men", icon: Shirt },
  { title: "Boys", href: "/admin/boys", icon: Shirt },
  { title: "Accessories", href: "/admin/accessories", icon: Gem },
  { title: "New Arrivals", href: "/admin/new-arrivals", icon: Sparkles },
  { title: "Girls", href: "/admin/girls", icon: Shirt },
  { title: "Women", href: "/admin/women", icon: Shirt },
  { title: "Categories", href: "/admin/categories", icon: Shapes },
  { title: "Banners", href: "/admin/banners", icon: ImageIcon },
  { title: "Reviews", href: "/admin/reviews", icon: Star },
  { title: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { title: "Customers", href: "/admin/customers", icon: Users },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

interface SidebarProps {
  closeSidebar?: () => void;
}

export default function Sidebar({ closeSidebar }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/admin/auth/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error(`Logout failed with status ${response.status}.`);
      }
      router.replace("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Admin logout failed:", error);
      window.alert("Could not sign out. Please try again.");
    }
  };

  return (
    <aside className="flex h-full w-full flex-col bg-[#142536] px-2.5 py-4 font-body text-white">
      <Link
        href="/admin"
        onClick={closeSidebar}
        className="flex h-12 shrink-0 items-center gap-2 border-b border-white/10 px-1 pb-4"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 72 56"
          className="h-7 w-9 shrink-0 text-[#7de2d2]"
          fill="none"
        >
          <path
            d="M35 18c0-4.4 3.3-7.5 7.5-7.5 4 0 7 2.9 7 6.8 0 4.3-3.2 6.3-7 8.7L7.2 47c-3.2 2-1.8 6.8 2 6.8h53.6c3.8 0 5.2-4.8 2-6.8L42.5 31"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="whitespace-nowrap text-[15px] font-bold tracking-tight text-white">
          ClothesTown
        </span>
      </Link>

      <nav
        aria-label="Admin navigation"
        className="mt-5 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain"
      >
        {menus.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.title}
              href={item.href}
              onClick={closeSidebar}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-10 items-center gap-3 rounded-lg px-2.5 text-[13px] font-medium transition-colors ${
                active
                  ? "bg-[#2867b2] text-white shadow-sm"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={17} strokeWidth={2} className="shrink-0" aria-hidden="true" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-2 flex min-h-9 items-center gap-3 rounded-lg px-2.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
      >
        <LogOut size={16} aria-hidden="true" />
        <span>Logout</span>
      </button>
    </aside>
  );
}
