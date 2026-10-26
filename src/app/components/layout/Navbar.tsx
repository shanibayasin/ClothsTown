"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  Heart,
  ShoppingCart,
  User,
  Search,
  X,
  ChevronDown,
  Snowflake,
} from "lucide-react";
import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { readJsonResponse } from "@/lib/api";
import ProductSearch from "@/app/components/layout/ProductSearch";
import BrandLogo from "@/app/components/layout/BrandLogo";
import { CATEGORY_CATALOG } from "@/lib/category-catalog";

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
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  status?: boolean;
  parentCategory?: string | null;
  routeGroup?: string;
  sortOrder?: number;
  sectionTiles?: DepartmentCategory[];
  menuGroups?: AccessoriesMenuGroup[];
};

type MegaMenuLink = {
  label: string;
  href: string;
};

type MegaMenuGroup = {
  title: string;
  links: MegaMenuLink[];
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
  const [openMegaMenu, setOpenMegaMenu] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const currentYear = new Date().getFullYear();
  
  const [collections, setCollections] = useState<Collection[]>([]);
  const [departmentCategories, setDepartmentCategories] = useState<
    Record<string, DepartmentCategory[]>
  >({});
  const [storeCategories, setStoreCategories] = useState<StoreCategory[]>([]);
  const [accessoriesMenuGroups, setAccessoriesMenuGroups] = useState<
    AccessoriesMenuGroup[]
  >([]);
  const [accessoriesMenuImage, setAccessoriesMenuImage] = useState("");

  const categoryRoute = useCallback((category: StoreCategory, fallback?: string) => {
    const parent = storeCategories.find(
      (item) => item._id === category.parentCategory
    );
    if (!category.slug) return fallback ?? "/shop";
    if (category.routeGroup) return `/shop/${category.routeGroup}/${category.slug}`;
    if (parent?.slug) return `/shop/${parent.slug}/${category.slug}`;
    return `/shop/${category.slug}`;
  }, [storeCategories]);
  const categoryRouteByName = useCallback((name: string, fallback: string) => {
    const match = storeCategories.find((category) =>
      [category.name, category.slug].some(
        (value) => value?.trim().toLowerCase() === name.trim().toLowerCase()
      )
    );
    return match ? categoryRoute(match) : fallback;
  }, [categoryRoute, storeCategories]);

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
        const databaseCategories = await readJsonResponse<StoreCategory[]>(response, []);
        const databaseCategoriesBySlug = new Map(
          databaseCategories.map((category) => [category.slug, category])
        );
        const categories = CATEGORY_CATALOG.map((definition) => ({
          ...definition,
          ...databaseCategoriesBySlug.get(definition.slug),
          _id: databaseCategoriesBySlug.get(definition.slug)?._id ?? definition.slug,
          name: definition.name,
          slug: definition.slug,
        }));
        setStoreCategories(categories);
        const sections: Record<string, DepartmentCategory[]> = {};
        for (const [sectionName, routeGroup] of [
          ["Men", "men"],
          ["Women", "women"],
          ["Girls", "girls"],
          ["Boys", "boys"],
        ]) {
          sections[sectionName] = categories
            .filter((category) => category.routeGroup === routeGroup)
            .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
            .map((category) => ({
              title: category.name,
              category: category.slug,
            }));
        }
        setAccessoriesMenuGroups(
          [{
            title: "Accessories & Others",
            categories: categories
              .filter((category) => category.routeGroup === "accessories")
              .map((category) => ({
                title: category.name,
                category: category.slug,
              })),
          }]
        );
        setAccessoriesMenuImage(
          categories.find((category) => category.routeGroup === "accessories" && category.image)?.image ?? ""
        );
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
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setOpenMegaMenu("");
        setSearchOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMegaMenu("");
        setSearchOpen(false);
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const navigationItems = useMemo(
    () => [
      { name: "Men", href: "/shop/men", key: "MEN" },
      { name: "Women", href: "/shop/women", key: "WOMEN" },
      { name: "Girls", href: "/shop/girls", key: "GIRLS" },
      { name: "Boys", href: "/shop/boys", key: "BOYS" },
      { name: "Accessories", href: "/shop/accessories", key: "ACCESSORIES" },
      { name: "New Arrivals", href: "/new-arrivals", key: "NEW IN" },
      { name: "Sale", href: "/shop?sale=true", key: "SALE" },
    ],
    []
  );

  const megaMenus = useMemo<Record<string, MegaMenuGroup[]>>(() => {
    const categoryFor = (name: string) =>
      storeCategories.find((category) =>
        [category.name, category.slug].some(
          (value) => value?.trim().toLowerCase() === name.toLowerCase()
        )
      );
    const collectionLinks = collections.map((collection) => ({
      label: collection.title,
      href: `/collections/${collection.slug}`,
    }));
    const department = (name: string, href: string, routeGroup: string): MegaMenuGroup[] => {
      const rootCategory = categoryFor(name.toLowerCase());
      const groupLinks = storeCategories
        .filter((category) => category.routeGroup === routeGroup)
        .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
        .map((category) => ({
          label: category.name,
          href: categoryRoute(category),
        }));
      const childLinks = groupLinks.length
        ? groupLinks
        : rootCategory
        ? storeCategories
            .filter((category) => category.parentCategory === rootCategory._id)
            .map((category) => ({
              label: category.name,
              href: categoryRoute(category),
            }))
        : [];
      const links = childLinks.length
        ? childLinks
        : (departmentCategories[name] ?? [])
            .filter((item) => item.title.trim() && item.category.trim())
            .map((item) => ({
              label: item.title,
              href: categoryRouteByName(
                item.category,
                `/shop?category=${encodeURIComponent(item.category)}`
              ),
            }));
      const groups: MegaMenuGroup[] = [
        { title: `Shop ${name}`, links: [{ label: `All ${name}`, href }] },
      ];
      if (links.length) groups.push({ title: "Shop by category", links });
      if (collectionLinks.length) {
        groups.push({ title: "Collections", links: collectionLinks });
      }
      return groups;
    };
    const accessoryLinks = storeCategories
      .filter((category) => category.routeGroup === "accessories")
      .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
      .map((category) => ({
        label: category.name,
        href: categoryRoute(category),
      }));
    const saleCollections = collectionLinks.filter((item) =>
      /\b(sale|discount|clearance|offer)\b/i.test(item.label)
    );
    return {
      "NEW IN": [
        {
          title: "Just in",
          links: [
            { label: "New Arrivals", href: "/new-arrivals" },
            { label: "All Products", href: "/shop?view=all" },
          ],
        },
      ],
      WOMEN: department("Women", "/shop/women", "women"),
      MEN: department("Men", "/shop/men", "men"),
      GIRLS: department("Girls", "/shop/girls", "girls"),
      BOYS: department("Boys", "/shop/boys", "boys"),
      MORE: [
        {
          title: "Shop more",
          links: [
            { label: "Girls", href: "/shop/girls" },
            { label: "Boys", href: "/shop/boys" },
            { label: "Collections", href: "/collections" },
          ],
        },
      ],
      SALE: [
        {
          title: "Shop Sale",
          links: [
            { label: "Sale Products", href: "/shop?sale=true" },
            { label: "Discounted Items", href: "/shop?sale=true" },
            ...saleCollections,
          ],
        },
      ],
      ACCESSORIES: [
        { title: "Shop Accessories", links: [{ label: "All Accessories", href: "/shop/accessories" }] },
        ...(storeCategories.some((category) => category.routeGroup === "accessories")
          ? [{
              title: "Accessories & Others",
              links: storeCategories
                .filter((category) => category.routeGroup === "accessories")
                .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
                .map((category) => ({
                  label: category.name,
                  href: categoryRoute(category),
                })),
            }]
          : []),
        ...(accessoryLinks.length
          ? [{ title: "Accessories & Others", links: accessoryLinks }]
          : []),
        ...(collectionLinks.length
          ? [{ title: "Collections", links: collectionLinks }]
          : []),
      ],
    };
  }, [categoryRoute, categoryRouteByName, collections, departmentCategories, storeCategories]);

  const mobileLinks = useMemo(
    () => [
      { name: "Home", href: "/" },
      ...navigationItems.map((item) => ({ name: item.name, href: item.href })),
      { name: "Collections", href: "/collections" },
    ],
    [navigationItems]
  );
  const links = useMemo(
    () => [
      { name: "Home", href: "/" },
      { name: "Men", href: "/shop/men", hasChevron: true },
      { name: "Women", href: "/shop/women", hasChevron: true },
      { name: "Girls", href: "/shop/girls", hasChevron: true },
      { name: "Boys", href: "/shop/boys", hasChevron: true },
      { name: "Accessories", href: "/shop/accessories", hasChevron: true },
      { name: "Collections", href: "/collections", collectionMenu: true },
      { name: "New Arrivals", href: "/new-arrivals" },
      { name: "Sale", href: "/shop?sale=true" },
    ],
    []
  );

  return (
    <>
      <header
        ref={headerRef}
        className={`sticky top-0 z-100 border-b border-[var(--border-color)] transition-all duration-300 ${
          scrolled
            ? "bg-[var(--page-background)]/95 shadow-sm backdrop-blur-xl"
            : "bg-[var(--page-background)]"
        }`}
      >
        <div className="relative mx-auto grid h-[58px] w-full max-w-[1440px] grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 sm:h-16 sm:px-6 md:h-[68px] md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-4 lg:px-10">
          <div className="flex min-w-0 items-center">
            <Link
              href="/"
              aria-label="ClothesTown home"
              onClick={() => {
                setOpenMegaMenu("");
                setSearchOpen(false);
              }}
              className="flex min-w-0 items-center gap-1.5 text-[var(--brand-primary)] sm:gap-2"
            >
              <BrandLogo />
            </Link>
          </div>

          <nav aria-label="Main navigation" className="hidden min-w-0 items-center justify-center gap-2 md:flex lg:gap-5 xl:gap-7">
            <Link
              href="/"
              aria-current={pathname === "/" ? "page" : undefined}
              onClick={() => {
                setOpenMegaMenu("");
                setSearchOpen(false);
              }}
              className={`relative flex h-[68px] shrink-0 items-center text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-secondary)] lg:text-xs ${
                pathname === "/" ? "text-[var(--brand-primary)]" : "text-[var(--text-primary)] hover:text-[var(--brand-secondary-foreground)]"
              }`}
            >
              Home
              {pathname === "/" && <span className="absolute bottom-3 left-0 right-0 h-px bg-[var(--brand-secondary)]" />}
            </Link>
            {navigationItems
              .filter((item) => !["GIRLS", "BOYS"].includes(item.key))
              .map((item) => {
                const hasMenu = ["MEN", "WOMEN", "ACCESSORIES"].includes(item.key);
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href.split("?")[0]}/`);
                const isMenuOpen = openMegaMenu === item.key;

                if (!hasMenu) {
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => {
                        setOpenMegaMenu("");
                        setSearchOpen(false);
                      }}
                      className={`shrink-0 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-secondary)] lg:text-xs ${
                        active ? "text-[var(--brand-primary)]" : "text-[var(--text-primary)] hover:text-[var(--brand-secondary-foreground)]"
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-haspopup="true"
                    aria-expanded={isMenuOpen}
                    aria-controls="navbar-mega-menu"
                    onClick={() => {
                      setSearchOpen(false);
                      setOpenMegaMenu((current) => current === item.key ? "" : item.key);
                    }}
                    className={`flex shrink-0 items-center gap-0.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-secondary)] lg:text-xs ${
                      active || isMenuOpen ? "text-[var(--brand-primary)]" : "text-[var(--text-primary)] hover:text-[var(--brand-secondary-foreground)]"
                    }`}
                  >
                    {item.name}
                    <ChevronDown size={11} aria-hidden="true" />
                  </button>
                );
              })}
          </nav>

          <div className="flex shrink-0 items-center gap-0.5 text-[var(--brand-primary)] sm:gap-1">
            <button
              type="button"
              aria-label={searchOpen ? "Close product search" : "Open product search"}
              aria-expanded={searchOpen}
              onClick={() => {
                setOpenMegaMenu("");
                setSearchOpen((current) => !current);
              }}
              className="hidden size-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--section-background)] hover:text-[var(--brand-secondary-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-secondary)] sm:size-9 md:flex"
            >
              {searchOpen ? <X size={16} /> : <Search size={16} strokeWidth={1.7} />}
            </button>
            <Link
              href="/login"
              aria-label="Account login and registration"
              className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--section-background)] hover:text-[var(--brand-secondary-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-secondary)] sm:size-9"
            >
              <User size={16} strokeWidth={1.7} />
            </Link>

            <Link href="/wishlist" aria-label={`Wishlist${wishlistCount ? `, ${wishlistCount} items` : ""}`} className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--section-background)] hover:text-[var(--brand-secondary-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-secondary)] sm:size-9">
              <span className="relative">
                <Heart size={16} strokeWidth={1.7} />
                {wishlistCount > 0 && <span className="absolute -right-2 -top-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[var(--brand-secondary)] px-1 text-[8px] font-bold text-white">{wishlistCount}</span>}
              </span>
            </Link>

            <Link href="/cart" aria-label={`Cart${totalCartItems ? `, ${totalCartItems} items` : ""}`} className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--section-background)] hover:text-[var(--brand-secondary-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-secondary)] sm:size-9">
              <span className="relative">
                <ShoppingCart size={16} strokeWidth={1.7} />
                {totalCartItems > 0 && <span className="absolute -right-2 -top-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[var(--brand-secondary)] px-1 text-[8px] font-bold text-white">{totalCartItems}</span>}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={isOpen}
              className="ml-0.5 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[var(--section-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-secondary)] md:hidden"
            >
              <Menu size={20} />
            </button>
          </div>

          {searchOpen && (
            <div className="absolute right-3 top-full z-50 w-[min(400px,calc(100vw-24px))] rounded-b-lg border border-[var(--border-color)] bg-white p-3 shadow-lg sm:right-6 md:right-10">
              <ProductSearch id="header-product-search" accountPage={isAccountPage} />
            </div>
          )}
        </div>

        <ProductSearch id="mobile-product-search" compact />

        <nav aria-label="Legacy navigation" className="hidden">
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
                      className={`flex h-full items-center gap-1 whitespace-nowrap text-[12px] font-semibold transition-colors lg:text-[14px] ${active ? "text-primary" : "text-[var(--brand-primary)] hover:text-primary"}`}
                    >
                      {link.name}
                      <Snowflake size={16} className="text-secondary-foreground" />
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
                      className={`relative flex h-full shrink-0 items-center gap-1 whitespace-nowrap text-[12px] font-semibold transition-colors lg:text-[14px] ${active ? "text-[var(--brand-primary)]" : "text-[var(--brand-primary)] hover:text-primary"}`}
                    >
                      Accessories
                      <ChevronDown size={14} strokeWidth={2.2} />
                      {active && (
                        <span className="absolute bottom-1 left-0 right-0 h-[3px] rounded-full bg-[var(--brand-primary)] lg:bottom-[7px]" />
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
                                    href={categoryRouteByName(
                                      category.category,
                                      `/shop?category=${encodeURIComponent(category.category)}`
                                    )}
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
                              className="relative block min-h-[240px] overflow-hidden rounded-sm bg-[var(--section-background)]"
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
                              className="flex min-h-[240px] items-center justify-center bg-[var(--section-background)] text-sm font-semibold uppercase tracking-wide text-[var(--brand-primary)]"
                            >
                              Shop Accessories
                            </Link>
                          )}
                        </div>
                        <Link
                          href={link.href}
                          onClick={() => setShowDepartmentMenu("")}
                          className="mt-5 inline-block border-t border-gray-100 pt-4 text-sm font-semibold text-[var(--brand-primary)] hover:text-primary"
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
                      className={`relative flex h-full shrink-0 items-center gap-1 whitespace-nowrap text-[12px] font-semibold transition-colors lg:text-[14px] ${active ? "text-[var(--brand-primary)]" : "text-[var(--brand-primary)] hover:text-primary"}`}
                    >
                      {sectionName}
                      <ChevronDown size={14} strokeWidth={2.2} />
                      {active && (
                        <span className="absolute bottom-1 left-0 right-0 h-[3px] rounded-full bg-[var(--brand-primary)] lg:bottom-[7px]" />
                      )}
                    </Link>
                    {menuOpen && (
                      <div className="absolute left-0 top-full z-50 w-64 rounded-b-xl border border-gray-200 bg-white py-2 shadow-xl">
                        <Link
                          href={link.href}
                          onClick={() => setShowDepartmentMenu("")}
                          className="block border-b border-gray-100 px-4 py-2.5 text-sm font-semibold text-[var(--brand-primary)] transition hover:bg-gray-50 hover:text-primary"
                        >
                          All {sectionName} Wear
                        </Link>
                        <div className="max-h-72 overflow-y-auto py-1">
                          {(departmentCategories[sectionName] ?? []).map((category, index) => (
                            <Link
                              key={`${category.category}-${index}`}
                              href={categoryRouteByName(
                                category.category,
                                `/shop?category=${encodeURIComponent(category.category)}`
                              )}
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
                  className={`relative flex h-full shrink-0 items-center gap-1 whitespace-nowrap text-[12px] font-semibold transition-colors lg:text-[14px] ${active ? "text-[var(--brand-primary)]" : "text-[var(--brand-primary)] hover:text-primary"}`}
                >
                  {link.name}
                  {"hasChevron" in link && link.hasChevron && <ChevronDown size={14} strokeWidth={2.2} />}
                  {active && <span className="absolute bottom-1 left-0 right-0 h-[3px] rounded-full bg-[var(--brand-primary)] lg:bottom-[7px]" />}
                </Link>
              );
            })}
          </div>
        </nav>

        {!isAccountPage && (
          <div
            id="navbar-mega-menu"
            aria-hidden={!openMegaMenu}
            className={`absolute left-0 right-0 top-full z-50 w-full bg-white text-black transition-[opacity,transform,visibility] duration-100 ${
              openMegaMenu
                ? "visible translate-y-0 opacity-100"
                : "invisible -translate-y-2 opacity-0"
            }`}
          >
            <div className="mx-auto grid max-h-[min(70vh,560px)] w-full max-w-[1440px] grid-cols-1 gap-x-10 gap-y-8 overflow-y-auto px-6 py-8 sm:grid-cols-2 sm:px-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-14 lg:px-12 lg:py-10">
              {(megaMenus[openMegaMenu] ?? []).map((group) => (
                <section key={group.title} aria-label={group.title}>
                  <h2 className="mb-5 border-b border-black pb-3 text-xs font-bold uppercase tracking-[0.14em] sm:text-sm">
                    {group.title}
                  </h2>
                  <ul className="space-y-4">
                    {group.links.map((menuLink) => (
                      <li key={`${menuLink.href}-${menuLink.label}`}>
                        <Link
                          href={menuLink.href}
                          onClick={() => setOpenMegaMenu("")}
                          tabIndex={openMegaMenu ? 0 : -1}
                          className="inline-block text-sm leading-6 text-neutral-800 transition-colors hover:text-black focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black sm:text-[15px]"
                        >
                          {menuLink.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Drawer Panel */}
      {isOpen && (
        <div
          className="fixed inset-0 z-999 bg-black/50 md:hidden transition-opacity duration-300"
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
              <nav aria-label="Mobile navigation" className="mt-4 px-6">
                {mobileLinks.map((link) => {
                  const active =
                    link.href === "/"
                      ? pathname === "/"
                      : pathname === link.href || pathname.startsWith(`${link.href.split("?")[0]}/`);
                  const menuExpanded = expandedDepartment === link.name;
                  const groups = megaMenus[link.name] ?? [];

                  if (groups.length) {
                    return (
                      <div key={link.name} className="border-b">
                        <button
                          type="button"
                          aria-haspopup="true"
                          aria-expanded={menuExpanded}
                          aria-controls={`mobile-menu-${link.name.toLowerCase().replaceAll(" ", "-")}`}
                          onClick={() => setExpandedDepartment(menuExpanded ? "" : link.name)}
                          className={`flex w-full items-center justify-between py-4 text-left text-base transition-colors ${
                            active || menuExpanded
                              ? "font-semibold text-primary"
                              : "text-gray-700 hover:text-primary"
                          }`}
                        >
                          <span>{link.name}</span>
                          <ChevronDown
                            size={17}
                            aria-hidden="true"
                            className={`transition-transform ${menuExpanded ? "rotate-180" : ""}`}
                          />
                        </button>
                        {menuExpanded && (
                          <div id={`mobile-menu-${link.name.toLowerCase().replaceAll(" ", "-")}`} className="mb-4 ml-3 space-y-4 border-l border-border pl-4">
                            {groups.map((group) => (
                              <section key={group.title}>
                                <h2 className="pb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                                  {group.title}
                                </h2>
                                {group.links.map((menuLink) => (
                                    <Link
                                      key={`${menuLink.href}-${menuLink.label}`}
                                      href={menuLink.href}
                                      onClick={() => setIsOpen(false)}
                                      className="block py-2 text-sm text-gray-700 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    >
                                      {menuLink.label}
                                    </Link>
                                ))}
                              </section>
                            ))}
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
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--section-background)] p-4">
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