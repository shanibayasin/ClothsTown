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
} from "lucide-react";

const menus = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Collections", href: "/admin/collections", icon: LayoutGrid },
  { title: "Products", href: "/admin/products", icon: Package },
  { title: "Categories", href: "/admin/categories", icon: Shapes },
  { title: "Banners", href: "/admin/banners", icon: ImageIcon },
  { title: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { title: "Customers", href: "/admin/customers", icon: Users },
  { title: "Reviews", href: "/admin/reviews", icon: Star },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

interface SidebarProps {
  closeSidebar?: () => void; // Optional prop for mobile drawer control
}

export default function Sidebar({ closeSidebar }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      const keysToClear = ["token", "authToken", "adminToken", "user", "adminUser", "auth"];
      keysToClear.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
    }

    router.replace("/");
  };

  return (
    <aside
      className="relative flex h-full w-full flex-col justify-between border-r border-white/10 text-white shadow-2xl font-body lg:rounded-r-3xl overflow-hidden"
      style={{ backgroundColor: "#6f1d46" }}
    >
      <div className="w-full">
        {/* BRAND AREA */}
        <div
          className="flex h-24 md:h-28 items-center justify-start border-b border-white/10 px-7"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.04)" }}
        >
          <Link 
            href="/admin" 
            onClick={closeSidebar} 
            className="flex items-center justify-start w-full h-full"
          >
            <span className="text-xl font-bold tracking-wide text-white transition-transform duration-300 hover:scale-[1.04]">
              ClothesTown
            </span>
          </Link>
        </div>

        {/* NAVIGATION AREA */}
        <nav className="mt-6 md:mt-8 px-4 flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-200px)] no-scrollbar">
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
                onClick={closeSidebar} // Click hote hi mobile drawer auto-close ho jayega
                className={`group flex items-center gap-4 rounded-xl px-5 py-3.5 text-[15px] font-semibold tracking-wide select-none cursor-pointer relative transition-all duration-300
                  ${
                    active
                      ? "bg-white/15 text-white shadow-md"
                      : "text-white/70 hover:bg-white/5 hover:text-white hover:translate-x-1.5"
                  }`}
              >
                {/* ACTIVE LINK SIDE ACCENT */}
                {active && (
                  <span
                    className="absolute left-0 top-1/4 h-1/2 w-1 rounded-r-full"
                    style={{
                      backgroundColor: "#d98da5",
                      boxShadow: "0 0 10px #d98da5",
                    }}
                  />
                )}

                <Icon
                  size={22}
                  className="shrink-0 transition-all duration-300"
                  style={{
                    color: active ? "#d98da5" : "rgba(255, 255, 255, 0.65)",
                  }}
                />

                <span
                  className="font-sans tracking-wide transition-colors duration-300"
                  style={{ color: "#ffffff" }}
                >
                  {item.title}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* LOGOUT BUTTON AREA */}
      <div className="border-t border-white/10 p-4 mb-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-4 rounded-xl px-5 py-3.5 text-[15px] font-semibold transition-all duration-300 ease-out cursor-pointer group"
          style={{ color: "rgba(255, 255, 255, 0.75)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
            e.currentTarget.style.color = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.75)";
          }}
        >
          <LogOut size={22} className="shrink-0 transition-all duration-300" />
          <span className="font-sans tracking-wide">Logout</span>
        </button>
      </div>
    </aside>
  );
}