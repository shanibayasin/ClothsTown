"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Heart,
  ShoppingBag,
  User,
  X,
  ChevronDown,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { readJsonResponse } from "@/lib/api";

type Collection = {
  _id: string;
  title: string;
  slug: string;
};

export default function Navbar() {
  const pathname = usePathname() || "";
  
  // Destructured target cart array to compute runtime totals dynamically
  const { cart } = useCart();
  const { wishlistCount } = useWishlist();

  const [isOpen, setIsOpen] = useState(false);
  const [showCollectionMenu, setShowCollectionMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentYear, setCurrentYear] = useState(2026);
  
  const [collections, setCollections] = useState<Collection[]>([]);

  // Derive structural dynamic item count safely from raw elements array matrix
  const totalCartItems = useMemo(() => {
    return cart?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }, [cart]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    async function loadCollections() {
      try {
        const res = await fetch("/api/collections/public");
        const data = await readJsonResponse<Collection[]>(res, []);
        setCollections(data);
      } catch (error) {
        console.error("Collections fetch error log:", error);
      }
    }

    setCurrentYear(new Date().getFullYear());
    loadCollections();
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const openCollectionsMenu = () => setShowCollectionMenu(true);
    window.addEventListener("open-collections-menu", openCollectionsMenu);

    return () => {
      window.removeEventListener("open-collections-menu", openCollectionsMenu);
    };
  }, []);

  const links = useMemo(() => [
    { name: "Shop", href: "/shop" },
    { name: "Collections", href: "/collections" },
    { name: "New Arrivals", href: "/new-arrivals" },
    { name: "Featured", href: "/featured" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ], []);

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-primary py-2 text-center text-xs font-medium tracking-[0.18em] text-white uppercase">
        ✨ Free Shipping on Orders Over Rs. 5000
      </div>

      {/* Main Sticky Header */}
      <header
        className={`sticky top-0 z-100 transition-all duration-500 ${
          scrolled
            ? "border-b bg-white/95 shadow-lg backdrop-blur-xl"
            : "bg-white"
        }`}
      >
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-5 lg:px-8">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open navigation menu"
            className="rounded-lg p-2 transition hover:bg-gray-100 lg:hidden"
          >
            <Menu size={26} />
          </button>

          {/* Luxury Logo Branding */}
          <Link href="/" className="shrink-0">
            <Image
              src="/logo.png"
              alt="Veloraé Logo"
              width={240}
              height={70}
              priority
              className="h-16 w-auto transition duration-300 hover:scale-105 lg:h-20"
            />
          </Link>

          {/* Desktop Links Mapping Layer */}
          <nav className="hidden items-center gap-9 lg:flex">
            {links.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname === link.href || pathname.startsWith(link.href + "/");

              if (link.name === "Collections") {
                return (
                  <div
                    key={link.name}
                    className="relative py-4"
                    onMouseEnter={() => setShowCollectionMenu(true)}
                    onMouseLeave={() => setShowCollectionMenu(false)}
                  >
                    <button
                      onClick={() => setShowCollectionMenu((prev) => !prev)}
                      className={`flex items-center gap-1 text-sm font-semibold uppercase tracking-[0.15em] transition-colors duration-300 ${
                        active ? "text-primary" : "text-gray-700 hover:text-primary"
                      }`}
                    >
                      Collections
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${
                          showCollectionMenu ? "rotate-180 text-primary" : "text-gray-400"
                        }`}
                      />
                    </button>

                    {/* Integrated Dropdown Container */}
                    {showCollectionMenu && (
                      <div className="absolute left-1/2 z-50 mt-5 w-162.5 -translate-x-1/2 overflow-hidden rounded-3xl border border-[#f0dce5] bg-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300 grid grid-cols-12">
                        <div className="p-6 col-span-7 flex flex-col justify-between">
                          <div>
                            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                              Collections
                            </p>

                            <div className="space-y-1 max-h-70 overflow-y-auto pr-1">
                              {collections.map((item) => (
                                <Link
                                  key={item._id}
                                  href={`/collections/${item.slug}`}
                                  onClick={() => setShowCollectionMenu(false)}
                                  className="block rounded-xl px-4 py-2.5 transition hover:bg-[#faf5f7] group"
                                >
                                  <h4 className="font-semibold text-gray-900 group-hover:text-primary transition-colors text-sm">
                                    {item.title}
                                  </h4>
                                  <p className="mt-0.5 text-xs text-gray-500">
                                    Explore Collection
                                  </p>
                                </Link>
                              ))}
                            </div>
                          </div>

                          <Link
                            href="/collections"
                            onClick={() => setShowCollectionMenu(false)}
                            className="mt-4 inline-block font-semibold text-primary hover:translate-x-1 transition-transform text-sm"
                          >
                            View All →
                          </Link>
                        </div>

                        <div className="relative bg-[#faf5f7] p-8 col-span-5 flex flex-col justify-end min-h-85">
                          <Image
                            src="/images/menu-banner.jpg"
                            alt="Luxury Collection"
                            fill
                            className="object-cover"
                            priority
                          />
                          <div className="absolute inset-0 bg-black/35"></div>
                          <div className="relative z-10 flex flex-col justify-end h-full">
                            <p className="text-xs uppercase tracking-[0.2em] text-white/90">
                              Featured
                            </p>
                            <h3 className="mt-1 text-2xl font-bold text-white leading-tight">
                              Luxury Abayas
                            </h3>
                            <Link
                              href="/collections"
                              onClick={() => setShowCollectionMenu(false)}
                              className="mt-4 inline-flex w-fit rounded-full bg-white px-5 py-2 text-xs font-semibold text-primary hover:bg-gray-50 shadow-md transition-all duration-300 hover:scale-105"
                            >
                              Shop Now
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`group relative text-sm font-semibold uppercase tracking-[0.15em] transition duration-300 ${
                    active 
                      ? "text-primary font-semibold" 
                      : "text-[#2B1A22] hover:text-primary"
                  }`}
                >
                  {link.name}
                  <span
                    className={`absolute -bottom-2 left-0 h-0.5 bg-primary transition-all duration-300 ${
                      active ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Right Controls Actions Panel */}
          <div className="flex items-center gap-3 lg:gap-4">
            <Link
              href="/wishlist"
              aria-label="View wishlist"
              className="relative rounded-full p-2 transition hover:bg-gray-100 hover:text-primary"
            >
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              aria-label="View shopping bag"
              className="relative rounded-full p-2 transition hover:bg-gray-100 hover:text-primary"
            >
              <ShoppingBag size={20} />
              {totalCartItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white scale-105 transition-transform duration-200">
                  {totalCartItems}
                </span>
              )}
            </Link>

            <div
              className="relative"
              onMouseEnter={() => setShowAccountMenu(true)}
              onMouseLeave={() => setShowAccountMenu(false)}
            >
              <button
                onClick={() => setShowAccountMenu((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
              >
                <User size={18} />
                <span className="hidden sm:inline">Account</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${
                    showAccountMenu ? "rotate-180 text-primary" : "text-gray-400"
                  }`}
                />
              </button>

              {showAccountMenu && (
                <div className="absolute right-0 z-50 mt-3 w-44 rounded-2xl border border-[#f0dce5] bg-white p-3 shadow-xl">
                  <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
                    Guest Dropdown
                  </p>
                  <Link
                    href="/login"
                    onClick={() => setShowAccountMenu(false)}
                    className="mb-2 block rounded-xl px-2 py-2 text-sm font-medium text-gray-700 transition hover:bg-[#faf5f7] hover:text-primary"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setShowAccountMenu(false)}
                    className="block rounded-xl px-2 py-2 text-sm font-medium text-gray-700 transition hover:bg-[#faf5f7] hover:text-primary"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Panel */}
      {isOpen && (
        <div
          className="fixed inset-0 z-999 bg-black/50 lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto bg-white shadow-2xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b px-6 py-5">
                <Image
                  src="/logo.png"
                  alt="Veloraé"
                  width={170}
                  height={50}
                  className="h-12 w-auto"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close navigation menu"
                  className="rounded-lg p-2 hover:bg-gray-100"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Mobile Links Map */}
              <nav className="px-6 mt-4">
                {links.map((link) => {
                  const active =
                    link.href === "/"
                      ? pathname === "/"
                      : pathname === link.href || pathname.startsWith(link.href + "/");

                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`block border-b py-4 text-base transition-colors ${
                        active ? "font-semibold text-primary" : "text-gray-700 hover:text-primary"
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Quick Action Panels */}
              <div className="mt-8 px-6">
                <div className="grid grid-cols-2 gap-4">
                  <Link
                    href="/wishlist"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium text-gray-700 transition hover:bg-primary hover:text-white"
                  >
                    <Heart size={18} />
                    Wishlist ({wishlistCount})
                  </Link>
                  <Link
                    href="/cart"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium text-gray-700 transition hover:bg-primary hover:text-white"
                  >
                    <ShoppingBag size={18} />
                    Cart ({totalCartItems})
                  </Link>
                </div>
              </div>

              {/* Mobile Account Access CTA */}
              <div className="mt-10 px-6">
                <div className="rounded-2xl border border-[#f0dce5] bg-[#faf5f7] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                    Guest Dropdown
                  </p>
                  <div className="mt-3 space-y-2">
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="block rounded-xl bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:text-primary"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsOpen(false)}
                      className="block rounded-xl bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:text-primary"
                    >
                      Create Account
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 border-t px-6 py-6 bg-gray-50/50">
              <p className="text-center text-sm text-gray-500">
                Luxury Fashion for Modern Women
              </p>
              <p className="mt-2 text-center text-xs text-gray-400">
                © {currentYear} Veloraé
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}