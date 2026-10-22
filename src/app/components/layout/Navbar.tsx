"use client";

import Link from "next/link";
import Image from "next/image";
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

type DepartmentCategory = {
  title: string;
  category: string;
};

type AccessoriesMenuGroup = {
  title: string;
  categories: DepartmentCategory[];
};

type StoreCategory = {
  name: string;
  slug?: string;
  image?: string;
  sectionTiles?: DepartmentCategory[];
  menuGroups?: AccessoriesMenuGroup[];
};

export default function Navbar() {
  const pathname = usePathname() || "";
  const isAccountPage = pathname === "/login" || pathname === "/register";
  
  // Destructured target cart array to compute runtime totals dynamically
  const { cart } = useCart();
  const { wishlistCount } = useWishlist();

  const [isOpen, setIsOpen] = useState(false);
  const [expandedDepartment, setExpandedDepartment] = useState("");
  const [showDepartmentMenu, setShowDepartmentMenu] = useState("");
  const [showCollectionMenu, setShowCollectionMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const currentYear = new Date().getFullYear();
  
  const [collections, setCollections] = useState<Collection[]>([]);
  const [departmentCategories, setDepartmentCategories] = useState<
    Record<string, DepartmentCategory[]>
  >({});
  const [accessoriesMenuGroups, setAccessoriesMenuGroups] = useState<
    AccessoriesMenuGroup[]
  >([]);
  const [accessoriesMenuImage, setAccessoriesMenuImage] = useState("");

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

    async function loadDepartmentCategories() {
      try {
        const response = await fetch("/api/categories", { cache: "no-store" });
        const categories = await readJsonResponse<StoreCategory[]>(response, []);
        const sections: Record<string, DepartmentCategory[]> = {};
        for (const sectionName of ["Men", "Women", "Girls", "Boys"]) {
          const sectionPattern =
            sectionName === "Girls"
              ? /\bgirls?\b/
              : sectionName === "Women"
                ? /\bwomen\b|womens/
                : sectionName === "Men"
                  ? /\bmen\b|\bmens\b|\bmenswear\b/
                  : /\bboys?\b/;
          const sectionCategories = categories.filter((category) =>
            sectionPattern.test(
              `${category.name.trim().toLowerCase()} ${category.slug?.trim().toLowerCase() ?? ""}`
            )
          );
          const sectionCategory =
            sectionCategories.find(
              (category) => (category.sectionTiles?.length ?? 0) > 0
            ) ?? sectionCategories[0];
          sections[sectionName] = (sectionCategory?.sectionTiles ?? []).filter(
            (tile) => tile.title?.trim() && tile.category?.trim()
          );
        }
        const accessoriesCategory = categories.find((category) =>
          /^(accessory|accessories)$/.test(
            category.name.trim().toLowerCase()
          ) ||
          /^(accessory|accessories)$/.test(
            category.slug?.trim().toLowerCase() ?? ""
          )
        );
        setAccessoriesMenuGroups(
          (accessoriesCategory?.menuGroups ?? []).filter(
            (group) => group.title?.trim()
          )
        );
        setAccessoriesMenuImage(accessoriesCategory?.image ?? "");
        setDepartmentCategories(sections);
      } catch (error) {
        console.error("Department categories fetch error:", error);
      }
    }

    loadCollections();
    loadDepartmentCategories();
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
      { name: "Men", href: "/shop/men", hasChevron: true },
      { name: "Women", href: "/shop/women", hasChevron: true },
      { name: "Girls", href: "/shop/girls", hasChevron: true },
      { name: "Boys", href: "/shop/boys", hasChevron: true },
      { name: "Accessories", href: "/shop/accessories", hasChevron: true },
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
        <div className={`mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 sm:px-6 md:grid-cols-[minmax(220px,0.85fr)_minmax(180px,1.45fr)_minmax(190px,0.6fr)] md:gap-5 lg:gap-8 lg:px-8 ${isAccountPage ? "h-[58px] sm:h-[66px] md:h-[72px] lg:h-[72px] lg:grid-cols-[minmax(210px,0.85fr)_minmax(180px,1.45fr)_minmax(165px,0.6fr)] lg:px-14" : "h-[58px] sm:h-[68px] md:h-[82px] lg:h-[98px]"}`}>
          <div className="flex min-w-0 items-center">
            <Link href="/" aria-label="ClothesTown home" className="flex min-w-0 items-center gap-2 text-[#102633] sm:gap-3">
              <svg aria-hidden="true" viewBox="0 0 72 56" className={`shrink-0 ${isAccountPage ? "h-7 w-9 sm:h-8 sm:w-10 lg:h-8 lg:w-11" : "h-7 w-9 sm:h-11 sm:w-14 lg:h-14 lg:w-[70px]"}`} fill="none">
                <path d="M35 18c0-4.4 3.3-7.5 7.5-7.5 4 0 7 2.9 7 6.8 0 4.3-3.2 6.3-7 8.7L7.2 47c-3.2 2-1.8 6.8 2 6.8h53.6c3.8 0 5.2-4.8 2-6.8L42.5 31" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className={`truncate whitespace-nowrap font-bold tracking-tight ${isAccountPage ? "text-[14px] sm:text-xl lg:text-[24px]" : "text-[14px] sm:text-xl lg:text-[30px]"}`}>
                ClothesTown<span className={`font-medium text-[#9aa5ad] ${isAccountPage ? "text-[11px] sm:text-sm lg:text-[18px]" : "text-[11px] sm:text-sm lg:text-[26px]"}`}>.com</span>
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
              className={`min-w-0 flex-1 border border-r-0 border-[#d9e0e5] bg-[#f7f8fa] text-[#243643] outline-none transition focus:border-[#9eabb3] focus:bg-white ${isAccountPage ? "h-9 rounded-l-[9px] px-3 text-[10px] lg:h-[34px] lg:px-3" : "h-10 rounded-l-[18px] px-4 text-sm lg:h-14 lg:rounded-l-[20px] lg:px-5"}`}
            />
            <button
              type="submit"
              aria-label="Search products"
              className={`flex items-center justify-center bg-[#102633] text-white transition hover:bg-primary ${isAccountPage ? "h-9 w-10 rounded-r-[9px] lg:h-[34px] lg:w-10" : "h-10 w-12 rounded-r-[18px] lg:h-14 lg:w-[68px] lg:rounded-r-[20px]"}`}
            >
              <Search size={isAccountPage ? 17 : 21} />
            </button>
          </form>

          <div className="flex shrink-0 items-center">
            <Link
              href="/login"
              aria-label="Account login and registration"
              className={`flex flex-col items-center justify-center gap-0.5 border-l border-[#dfe4e8] text-[#102633] transition hover:text-primary md:border-l-0 ${isAccountPage ? "h-10 min-w-9 px-1.5 sm:h-12 sm:min-w-[58px] sm:px-2 lg:h-10 lg:min-w-[58px] lg:px-1" : "h-10 min-w-9 px-1.5 sm:h-12 sm:min-w-[72px] sm:px-3 lg:h-[54px] lg:min-w-[112px]"}`}
            >
              <User size={20} strokeWidth={1.8} className={isAccountPage ? "sm:size-5 lg:size-[19px]" : "lg:size-[26px]"} />
              <span className={`hidden leading-none sm:block ${isAccountPage ? "text-[9px]" : "text-xs lg:text-[14px]"}`}>Account</span>
            </Link>

            <Link href="/wishlist" aria-label={`Wishlist${wishlistCount ? `, ${wishlistCount} items` : ""}`} className={`flex flex-col items-center justify-center gap-0.5 border-l border-[#dfe4e8] text-[#102633] transition hover:text-primary ${isAccountPage ? "h-9 min-w-8 px-1 sm:h-12 sm:min-w-[58px] sm:px-2 lg:h-10 lg:min-w-[58px] lg:px-1" : "h-9 min-w-8 px-1 sm:h-12 sm:min-w-[72px] sm:px-3 lg:h-[54px] lg:min-w-[112px]"}`}>
              <span className="relative">
                <Heart size={18} strokeWidth={1.8} className={isAccountPage ? "sm:size-5 lg:size-[19px]" : "sm:size-5 lg:size-[26px]"} />
                {wishlistCount > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">{wishlistCount}</span>}
              </span>
              <span className={`hidden leading-none sm:block ${isAccountPage ? "text-[9px]" : "text-xs lg:text-[14px]"}`}>Wishlist</span>
            </Link>

            <Link href="/cart" aria-label={`Cart${totalCartItems ? `, ${totalCartItems} items` : ""}`} className={`flex flex-col items-center justify-center gap-0.5 border-l border-[#dfe4e8] text-[#102633] transition hover:text-primary ${isAccountPage ? "h-9 min-w-8 px-1 sm:h-12 sm:min-w-[58px] sm:px-2 lg:h-10 lg:min-w-[58px] lg:px-1" : "h-9 min-w-8 px-1 sm:h-12 sm:min-w-[72px] sm:px-3 lg:h-[54px] lg:min-w-[112px]"}`}>
              <span className="relative">
                <ShoppingCart size={18} strokeWidth={1.8} className={isAccountPage ? "sm:size-5 lg:size-[19px]" : "sm:size-5 lg:size-[26px]"} />
                <span className="absolute -right-2.5 -top-2.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{totalCartItems}</span>
              </span>
              <span className={`hidden leading-none sm:block ${isAccountPage ? "text-[9px]" : "text-xs lg:text-[14px]"}`}>Cart</span>
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

        <nav aria-label="Main navigation" className={`hidden border-t border-gray-100 md:block ${isAccountPage ? "!hidden" : ""}`}>
          <div className="mx-auto flex h-10 max-w-[1440px] items-center justify-start gap-5 overflow-visible px-6 lg:h-[67px] lg:gap-9 lg:px-10">
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
                      className={`flex h-full items-center gap-1 whitespace-nowrap text-[12px] font-semibold transition-colors lg:text-[14px] ${active ? "text-primary" : "text-[#172a33] hover:text-primary"}`}
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

              if (link.name === "Accessories") {
                const menuOpen = showDepartmentMenu === "Accessories";
                return (
                  <div
                    key={link.name}
                    className="relative flex h-full items-center"
                    onMouseEnter={() => setShowDepartmentMenu("Accessories")}
                    onMouseLeave={() => setShowDepartmentMenu("")}
                    onFocus={() => setShowDepartmentMenu("Accessories")}
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                        setShowDepartmentMenu("");
                      }
                    }}
                  >
                    <Link
                      href={link.href}
                      aria-haspopup="true"
                      aria-expanded={menuOpen}
                      className={`relative flex h-full shrink-0 items-center gap-1 whitespace-nowrap text-[12px] font-semibold transition-colors lg:text-[14px] ${active ? "text-[#102633]" : "text-[#172a33] hover:text-primary"}`}
                    >
                      Accessories
                      <ChevronDown size={14} strokeWidth={2.2} />
                      {active && (
                        <span className="absolute bottom-1 left-0 right-0 h-[3px] rounded-full bg-[#102633] lg:bottom-[7px]" />
                      )}
                    </Link>
                    {menuOpen && (
                      <div className="absolute left-0 top-full z-50 w-[min(1100px,calc(100vw-32px))] rounded-b-xl border border-gray-200 bg-white p-6 shadow-xl lg:w-[min(1200px,calc(100vw-48px))]">
                        <div
                          className="grid gap-6"
                          style={{
                            gridTemplateColumns: `repeat(${Math.max(
                              accessoriesMenuGroups.length,
                              1
                            )}, minmax(0, 1fr)) minmax(260px, 1.2fr)`,
                          }}
                        >
                          {accessoriesMenuGroups.map((group, groupIndex) => (
                            <div key={`${group.title}-${groupIndex}`}>
                              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-[#333]">
                                {group.title}
                              </h2>
                              <div className="space-y-3">
                                {group.categories.map((category, categoryIndex) => (
                                  <Link
                                    key={`${category.category}-${categoryIndex}`}
                                    href={`/shop?category=${encodeURIComponent(category.category)}`}
                                    onClick={() => setShowDepartmentMenu("")}
                                    className="block text-sm text-[#444] transition hover:text-primary"
                                  >
                                    {category.title}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                          {accessoriesMenuImage ? (
                            <Link
                              href={link.href}
                              onClick={() => setShowDepartmentMenu("")}
                              className="relative block min-h-[240px] overflow-hidden rounded-sm bg-[#f5f2ed]"
                            >
                              <Image
                                src={accessoriesMenuImage}
                                alt="Shop accessories"
                                fill
                                sizes="(max-width: 1200px) 40vw, 420px"
                                className="object-cover"
                              />
                            </Link>
                          ) : (
                            <Link
                              href={link.href}
                              onClick={() => setShowDepartmentMenu("")}
                              className="flex min-h-[240px] items-center justify-center bg-[#f5f2ed] text-sm font-semibold uppercase tracking-wide text-[#172a33]"
                            >
                              Shop Accessories
                            </Link>
                          )}
                        </div>
                        <Link
                          href={link.href}
                          onClick={() => setShowDepartmentMenu("")}
                          className="mt-5 inline-block border-t border-gray-100 pt-4 text-sm font-semibold text-[#172a33] hover:text-primary"
                        >
                          Shop All Accessories
                        </Link>
                      </div>
                    )}
                  </div>
                );
              }

              if (["Men", "Girls", "Women", "Boys"].includes(link.name)) {
                const sectionName = link.name;
                const menuOpen = showDepartmentMenu === sectionName;
                return (
                  <div
                    key={link.name}
                    className="relative flex h-full items-center"
                    onMouseEnter={() => setShowDepartmentMenu(sectionName)}
                    onMouseLeave={() => setShowDepartmentMenu("")}
                    onFocus={() => setShowDepartmentMenu(sectionName)}
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                        setShowDepartmentMenu("");
                      }
                    }}
                  >
                    <Link
                      href={link.href}
                      aria-haspopup="true"
                      aria-expanded={menuOpen}
                      className={`relative flex h-full shrink-0 items-center gap-1 whitespace-nowrap text-[12px] font-semibold transition-colors lg:text-[14px] ${active ? "text-[#102633]" : "text-[#172a33] hover:text-primary"}`}
                    >
                      {sectionName}
                      <ChevronDown size={14} strokeWidth={2.2} />
                      {active && (
                        <span className="absolute bottom-1 left-0 right-0 h-[3px] rounded-full bg-[#102633] lg:bottom-[7px]" />
                      )}
                    </Link>
                    {menuOpen && (
                      <div className="absolute left-0 top-full z-50 w-64 rounded-b-xl border border-gray-200 bg-white py-2 shadow-xl">
                        <Link
                          href={`/shop?category=${sectionName}`}
                          onClick={() => setShowDepartmentMenu("")}
                          className="block border-b border-gray-100 px-4 py-2.5 text-sm font-semibold text-[#172a33] transition hover:bg-gray-50 hover:text-primary"
                        >
                          All {sectionName} Wear
                        </Link>
                        <div className="max-h-72 overflow-y-auto py-1">
                          {(departmentCategories[sectionName] ?? []).map((category, index) => (
                            <Link
                              key={`${category.category}-${index}`}
                              href={`/shop?category=${encodeURIComponent(category.category)}`}
                              onClick={() => setShowDepartmentMenu("")}
                              className="block px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 hover:text-primary"
                            >
                              {category.title}
                            </Link>
                          ))}
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
                  className={`relative flex h-full shrink-0 items-center gap-1 whitespace-nowrap text-[12px] font-semibold transition-colors lg:text-[14px] ${active ? "text-[#102633]" : "text-[#172a33] hover:text-primary"}`}
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

                  if (["Men", "Girls", "Women", "Boys", "Accessories"].includes(link.name)) {
                    const sectionName = link.name;
                    const menuExpanded = expandedDepartment === sectionName;
                    return (
                      <div key={link.name} className="border-b">
                        <button
                          type="button"
                          aria-expanded={menuExpanded}
                          onClick={() => setExpandedDepartment(menuExpanded ? "" : sectionName)}
                          className={`flex w-full items-center justify-between py-4 text-left text-base transition-colors ${
                            active || menuExpanded
                              ? "font-semibold text-primary"
                              : "text-gray-700 hover:text-primary"
                          }`}
                        >
                          <span>{sectionName}</span>
                          <ChevronDown
                            size={17}
                            className={`transition-transform ${
                              menuExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {menuExpanded && (
                          <div className="mb-3 ml-3 border-l border-[#e5e7eb] pl-4">
                            <Link
                              href={`/shop?category=${sectionName}`}
                              onClick={() => setIsOpen(false)}
                              className="block py-2 text-sm font-medium text-[#172a33] hover:text-primary"
                            >
                              {sectionName === "Accessories"
                                ? "Shop All Accessories"
                                : `All ${sectionName} Wear`}
                            </Link>
                            {sectionName === "Accessories"
                              ? accessoriesMenuGroups.flatMap((group, groupIndex) => [
                                  <span
                                    key={`accessories-group-${groupIndex}`}
                                    className="block pt-3 text-xs font-bold uppercase tracking-wide text-[#333]"
                                  >
                                    {group.title}
                                  </span>,
                                  ...group.categories.map((category, index) => (
                                    <Link
                                      key={`${category.category}-${groupIndex}-${index}`}
                                      href={`/shop?category=${encodeURIComponent(category.category)}`}
                                      onClick={() => setIsOpen(false)}
                                      className="block py-2 text-sm text-gray-600 hover:text-primary"
                                    >
                                      {category.title}
                                    </Link>
                                  )),
                                ])
                              : (departmentCategories[sectionName] ?? []).map(
                                  (category, index) => (
                                    <Link
                                      key={`${category.category}-${index}`}
                                      href={`/shop?category=${encodeURIComponent(category.category)}`}
                                      onClick={() => setIsOpen(false)}
                                      className="block py-2 text-sm text-gray-600 hover:text-primary"
                                    >
                                      {category.title}
                                    </Link>
                                  )
                                )}
                          </div>
                        )}
                      </div>
                    );
                  }

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
                © {currentYear} ClothesTown
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}