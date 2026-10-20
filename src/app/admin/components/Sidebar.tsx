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
      className="relative flex h-full w-full flex-col justify-between overflow-hidden border-r border-gray-200 bg-white font-body text-gray-900 shadow-sm lg:rounded-r-3xl"
    >
      <div className="w-full">
        {/* BRAND AREA */}
        <div
          className="flex h-24 items-center justify-start border-b border-gray-200 px-7 md:h-28"
        >
          <Link 
            href="/admin" 
            onClick={closeSidebar} 
            className="flex h-full w-full items-center justify-start"
          >
            <span className="text-xl font-bold tracking-wide text-black transition-transform duration-300 hover:scale-[1.04]">
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
                      ? "bg-gray-100 text-black shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-black hover:translate-x-1.5"
                  }`}
              >
                {/* ACTIVE LINK SIDE ACCENT */}
                {active && (
                  <span
                    className="absolute left-0 top-1/4 h-1/2 w-1 rounded-r-full bg-black"
                    aria-hidden="true"
                  />
                )}

                <Icon
                  size={22}
                  className="shrink-0 transition-all duration-300"
                  aria-hidden="true"
                />

                <span className="font-sans tracking-wide transition-colors duration-300">
                  {item.title}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* LOGOUT BUTTON AREA */}
      <div className="mb-3 border-t border-gray-200 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="group flex w-full cursor-pointer items-center gap-4 rounded-xl px-5 py-3.5 text-[15px] font-semibold text-gray-600 transition-all duration-300 ease-out hover:bg-gray-100 hover:text-black"
        >
          <LogOut size={22} className="shrink-0 transition-all duration-300" />
          <span className="font-sans tracking-wide">Logout</span>
        </button>
      </div>
    </aside>
  );
}