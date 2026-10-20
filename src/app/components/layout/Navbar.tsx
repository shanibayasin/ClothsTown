"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Heart,
  ShoppingCart,
  User,
  X,
  ChevronDown,
  Search,
  Snowflake,
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
  const currentYear = new Date().getFullYear();
  
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

  const links = useMemo(
    () => [
      { name: "Home", href: "/" },
      { name: "Men", href: "/shop?category=Men", hasChevron: true },
      { name: "Women", href: "/shop?category=Women", hasChevron: true },
      { name: "Accessories", href: "/shop?category=Accessories", hasChevron: true },
      { name: "Winter Collection", href: "/collections", collectionMenu: true },
      { name: "New Arrivals", href: "/new-arrivals" },
      { name: "Sale", href: "/shop?sale=true" },
    ],
    []
  );

  return (
    <>
      <header
        className={`sticky top-0 z-100 border-b border-gray-200 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 shadow-md backdrop-blur-xl"
            : "bg-white"
        }`}
      >
        <div className="mx-auto grid h-[58px] max-w-[1440px] grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 sm:h-[68px] sm:px-6 md:h-[82px] md:grid-cols-[minmax(220px,0.85fr)_minmax(180px,1.45fr)_minmax(190px,0.6fr)] md:gap-5 lg:h-[98px] lg:gap-8 lg:px-8">
          <div className="flex min-w-0 items-center">
            <Link href="/" aria-label="ClothesTown home" className="flex min-w-0 items-center gap-2 text-[#102633] sm:gap-3">
              <svg aria-hidden="true" viewBox="0 0 72 56" className="h-7 w-9 shrink-0 sm:h-11 sm:w-14 lg:h-14 lg:w-[70px]" fill="none">
                <path d="M35 18c0-4.4 3.3-7.5 7.5-7.5 4 0 7 2.9 7 6.8 0 4.3-3.2 6.3-7 8.7L7.2 47c-3.2 2-1.8 6.8 2 6.8h53.6c3.8 0 5.2-4.8 2-6.8L42.5 31" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="truncate whitespace-nowrap text-[14px] font-bold tracking-tight sm:text-xl lg:text-[30px]">
                ClothesTown<span className="text-[11px] font-medium text-[#9aa5ad] sm:text-sm lg:text-[26px]">.com</span>
              </span>
            </Link>
          </div>

          <form action="/shop" method="get" role="search" className="hidden min-w-0 max-w-[660px] flex-1 md:flex">
            <label htmlFor="header-product-search" className="sr-only">Search products</label>
            <input
              id="header-product-search"
              type="search"
              name="search"
              placeholder="Search for jackets, hoodies, sweaters, and more..."
              className="h-10 min-w-0 flex-1 rounded-l-[18px] border border-r-0 border-[#d9e0e5] bg-[#f7f8fa] px-4 text-sm text-[#243643] outline-none transition focus:border-[#9eabb3] focus:bg-white lg:h-14 lg:rounded-l-[20px] lg:px-5"
            />
            <button
              type="submit"
              aria-label="Search products"
              className="flex h-10 w-12 items-center justify-center rounded-r-[18px] bg-[#102633] text-white transition hover:bg-primary lg:h-14 lg:w-[68px] lg:rounded-r-[20px]"
            >
              <Search size={21} />
            </button>
          </form>

          <div className="flex shrink-0 items-center">
            <div
              className="relative hidden border-l border-[#dfe4e8] sm:block md:border-l-0"
              onMouseEnter={() => setShowAccountMenu(true)}
              onMouseLeave={() => setShowAccountMenu(false)}
            >
              <button
                onClick={() => setShowAccountMenu((prev) => !prev)}
                aria-expanded={showAccountMenu}
                className="flex h-10 min-w-9 flex-col items-center justify-center gap-0.5 px-1.5 text-[#102633] transition hover:text-primary sm:h-12 sm:min-w-[72px] sm:px-3 lg:h-[54px] lg:min-w-[112px]"
              >
                <User size={20} strokeWidth={1.8} className="lg:size-[26px]" />
                <span className="hidden text-xs leading-none sm:block lg:text-[14px]">Account</span>
              </button>
              {showAccountMenu && (
                <div className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
                  <Link href="/admin" onClick={() => setShowAccountMenu(false)} className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary">
                    Login
                  </Link>
                  <Link href="/register" onClick={() => setShowAccountMenu(false)} className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary">
                    Create Account
                  </Link>
                </div>
              )}
            </div>

            <Link href="/wishlist" aria-label={`Wishlist${wishlistCount ? `, ${wishlistCount} items` : ""}`} className="flex h-9 min-w-8 flex-col items-center justify-center gap-0.5 border-l border-[#dfe4e8] px-1 text-[#102633] transition hover:text-primary sm:h-12 sm:min-w-[72px] sm:px-3 lg:h-[54px] lg:min-w-[112px]">
              <span className="relative">
                <Heart size={18} strokeWidth={1.8} className="sm:size-5 lg:size-[26px]" />
                {wishlistCount > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">{wishlistCount}</span>}
              </span>
              <span className="hidden text-xs leading-none sm:block lg:text-[14px]">Wishlist</span>
            </Link>

            <Link href="/cart" aria-label={`Cart${totalCartItems ? `, ${totalCartItems} items` : ""}`} className="flex h-9 min-w-8 flex-col items-center justify-center gap-0.5 border-l border-[#dfe4e8] px-1 text-[#102633] transition hover:text-primary sm:h-12 sm:min-w-[72px] sm:px-3 lg:h-[54px] lg:min-w-[112px]">
              <span className="relative">
                <ShoppingCart size={18} strokeWidth={1.8} className="sm:size-5 lg:size-[26px]" />
                <span className="absolute -right-2.5 -top-2.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{totalCartItems}</span>
              </span>
              <span className="hidden text-xs leading-none sm:block lg:text-[14px]">Cart</span>
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={isOpen}
              className="ml-1 flex size-9 shrink-0 items-center justify-center rounded-md text-[#102633] transition hover:bg-gray-100 md:hidden"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>

        <form action="/shop" method="get" role="search" className="flex border-t border-gray-100 px-4 py-2 md:hidden">
          <label htmlFor="mobile-product-search" className="sr-only">Search products</label>
          <input
            id="mobile-product-search"
            type="search"
            name="search"
            placeholder="Search products..."
            className="h-9 min-w-0 flex-1 rounded-l-full border border-r-0 border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-gray-400 focus:bg-white"
          />
          <button type="submit" aria-label="Search products" className="flex h-9 w-10 items-center justify-center rounded-r-full bg-[#14242b] text-white">
            <Search size={16} />
          </button>
        </form>

        <nav aria-label="Main navigation" className="hidden border-t border-gray-100 md:block">
          <div className="mx-auto flex h-10 max-w-[1440px] items-center justify-start gap-8 overflow-visible px-6 lg:h-[67px] lg:gap-14 lg:px-10">
            {links.map((link) => {
              const active = link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(link.href.split("?")[0] + "/");

              if (link.collectionMenu) {
                return (
                  <div
                    key={link.name}
                    className="relative flex h-full items-center"
                    onMouseEnter={() => setShowCollectionMenu(true)}
                    onMouseLeave={() => setShowCollectionMenu(false)}
                  >
                    <button
                      type="button"
                      aria-expanded={showCollectionMenu}
                      onClick={() => setShowCollectionMenu((prev) => !prev)}
                      className={`flex h-full items-center gap-1 whitespace-nowrap text-[12px] font-semibold transition-colors lg:text-[16px] ${active ? "text-primary" : "text-[#172a33] hover:text-primary"}`}
                    >
                      {link.name}
                      <Snowflake size={16} className="text-[#3b82f6]" />
                    </button>
                    {showCollectionMenu && (
                      <div className="absolute left-0 top-full z-50 w-72 rounded-b-xl border border-gray-200 bg-white p-3 shadow-xl">
                        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Shop collections</p>
                        <div className="max-h-64 overflow-y-auto">
                          {collections.map((item) => (
                            <Link
                              key={item._id}
                              href={`/collections/${item.slug}`}
                              onClick={() => setShowCollectionMenu(false)}
                              className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 hover:text-primary"
                            >
                              {item.title}
                            </Link>
                          ))}
                        </div>
                        <Link href="/collections" onClick={() => setShowCollectionMenu(false)} className="mt-2 block border-t border-gray-100 px-3 pt-3 text-sm font-semibold text-primary">
                          View all collections
                        </Link>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`relative flex h-full shrink-0 items-center gap-1 whitespace-nowrap text-[12px] font-semibold transition-colors lg:text-[16px] ${active ? "text-[#102633]" : "text-[#172a33] hover:text-primary"}`}
                >
                  {link.name}
                  {"hasChevron" in link && link.hasChevron && <ChevronDown size={14} strokeWidth={2.2} />}
                  {active && <span className="absolute bottom-1 left-0 right-0 h-[3px] rounded-full bg-[#102633] lg:bottom-[7px]" />}
                </Link>
              );
            })}
          </div>
        </nav>
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
                <Link href="/" onClick={() => setIsOpen(false)} className="text-xl font-bold tracking-wide text-primary">
                  ClothesTown
                </Link>
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
                    <ShoppingCart size={18} />
                    Cart ({totalCartItems})
                  </Link>
                </div>
              </div>

              {/* Mobile Account Access CTA */}
              <div className="mt-10 px-6">
                <div className="rounded-2xl border border-[#f0dce5] bg-[#faf5f7] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                    My Account
                  </p>
                  <div className="mt-3 space-y-2">
                    <Link
                      href="/admin"
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
                © {currentYear} ClothesTown
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}