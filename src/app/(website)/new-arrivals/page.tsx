"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  Headset,
  Heart,
  List,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

interface ProductCategory {
  _id?: string;
  name?: string;
  slug?: string;
}

interface ArrivalProduct {
  _id: string;
  name: string;
  slug: string;
  images?: string[];
  image?: string;
  price: number;
  discountPrice?: number;
  onSale?: boolean;
  shortDescription?: string;
  description?: string;
  category?: ProductCategory | string | null;
  sizes?: string[];
  colors?: string[];
  stock?: number;
  featured?: boolean;
  newArrival?: boolean;
  status?: boolean;
}

interface StoreBanner {
  image?: string;
  title?: string;
  subtitle?: string;
  description?: string;
}

interface StoreCategory {
  name: string;
  slug?: string;
  image?: string;
  sectionTiles?: {
    title: string;
    image: string;
    category: string;
  }[];
}

const ITEMS_PER_PAGE = 12;
const DEFAULT_COLORS = [
  { name: "Black", hex: "#202020" },
  { name: "Navy", hex: "#19364e" },
  { name: "White", hex: "#f8f7f4" },
  { name: "Beige", hex: "#cdbb9d" },
  { name: "Brown", hex: "#805640" },
  { name: "Green", hex: "#526d57" },
  { name: "Gray", hex: "#92999d" },
  { name: "Red", hex: "#a13e42" },
  { name: "Blue", hex: "#527eaa" },
];

const benefits = [
  { Icon: Sparkles, title: "Trendy Styles", detail: "Freshly selected for you" },
  { Icon: Truck, title: "Nationwide Delivery", detail: "Across Pakistan" },
  { Icon: PackageCheck, title: "Cash on Delivery", detail: "Pay when it arrives" },
  { Icon: RefreshCw, title: "Easy Returns", detail: "Shop with confidence" },
];

function categoryName(product: ArrivalProduct) {
  return typeof product.category === "object" && product.category
    ? product.category.name ?? ""
    : typeof product.category === "string"
      ? product.category
      : "";
}

function productImage(product: ArrivalProduct) {
  return product.images?.find(Boolean) || product.image || "";
}

function productPrice(product: ArrivalProduct) {
  return product.discountPrice && product.discountPrice > 0
    ? product.discountPrice
    : product.price;
}

function colorHex(color: string) {
  const normalized = color.trim().toLowerCase();
  const match = DEFAULT_COLORS.find(
    (item) => item.name.toLowerCase() === normalized
  );
  if (match) return match.hex;
  if (/^#(?:[0-9a-f]{3}){1,2}$/i.test(normalized)) return normalized;
  return "#9aa3a9";
}

function getGender(name: string) {
  const value = name.toLowerCase();
  if (/\bmen\b|men's|mens/.test(value)) return "Men";
  if (/\bwomen\b|women's|womens|ladies/.test(value)) return "Women";
  if (/\bgirls?\b/.test(value)) return "Girls";
  if (/\bboys?\b/.test(value)) return "Boys";
  return "";
}

function isCategory(
  product: ArrivalProduct,
  selected: string
) {
  const name = categoryName(product).toLowerCase();
  const slug =
    typeof product.category === "object" && product.category
      ? product.category.slug?.toLowerCase() ?? ""
      : "";
  return name === selected.toLowerCase() || slug === selected.toLowerCase();
}

function productIsOnSale(product: ArrivalProduct) {
  return (
    product.onSale === true ||
    (product.onSale === undefined &&
      typeof product.discountPrice === "number" &&
      product.discountPrice > 0 &&
      product.discountPrice < product.price)
  );
}

export default function NewArrivalsPage() {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [products, setProducts] = useState<ArrivalProduct[]>([]);
  const [heroImage, setHeroImage] = useState("");
  const [sectionTiles, setSectionTiles] = useState<StoreCategory["sectionTiles"]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(0);
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedProductColors, setSelectedProductColors] = useState<
    Record<string, string>
  >({});
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPageData() {
      setIsLoading(true);
      setLoadError("");

      try {
        const [productResponse, bannerResponse, categoryResponse] = await Promise.all([
          fetch("/api/products?newArrival=true&limit=100", { cache: "no-store" }),
          fetch("/api/banners/public"),
          fetch("/api/categories", { cache: "no-store" }),
        ]);

        if (!productResponse.ok) {
          throw new Error(`Products could not be loaded (${productResponse.status}).`);
        }

        const productData: unknown = await productResponse.json();
        if (!Array.isArray(productData)) {
          throw new Error("The products response was not in the expected format.");
        }

        const arrivalProducts = (productData as ArrivalProduct[]).filter(
          (product) => product.newArrival === true && product.status !== false
        );

        let bannerData: StoreBanner[] = [];
        if (bannerResponse.ok) {
          const responseData: unknown = await bannerResponse.json();
          if (Array.isArray(responseData)) {
            bannerData = responseData as StoreBanner[];
          }
        } else {
          console.error(
            `New Arrivals banner request failed with status ${bannerResponse.status}.`
          );
        }

        let arrivalsCategory: StoreCategory | undefined;
        if (categoryResponse.ok) {
          const categoryData: unknown = await categoryResponse.json();
          if (Array.isArray(categoryData)) {
            arrivalsCategory = (categoryData as StoreCategory[]).find(
              (category) =>
                category.name.trim().toLowerCase() === "new arrivals" ||
                category.slug?.trim().toLowerCase() === "new-arrivals"
            );
          }
        } else {
          console.error(
            `New Arrivals category request failed with status ${categoryResponse.status}.`
          );
        }

        if (active) {
          setProducts(arrivalProducts);
          setSectionTiles(
            (arrivalsCategory?.sectionTiles ?? []).filter(
              (tile) => tile.title?.trim() && tile.image && tile.category?.trim()
            )
          );
          setHeroImage(
            arrivalsCategory?.image ??
              bannerData.find((banner) => banner.image)?.image ??
              (arrivalProducts[0] ? productImage(arrivalProducts[0]) : "")
          );
        }
      } catch (error) {
        console.error("Failed to load New Arrivals:", error);
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "New arrivals could not be loaded. Please try again."
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadPageData();
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(
    () =>
      Array.from(new Set(products.map(categoryName).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [products]
  );
  const sizes = useMemo(
    () =>
      Array.from(new Set(products.flatMap((product) => product.sizes ?? []))).sort(),
    [products]
  );
  const colors = useMemo(
    () =>
      Array.from(new Set(products.flatMap((product) => product.colors ?? []))).sort(),
    [products]
  );
  const priceCeiling = useMemo(
    () => Math.max(1000, ...products.map((product) => productPrice(product))),
    [products]
  );

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const name = product.name.toLowerCase();
      const description = `${product.shortDescription ?? ""} ${product.description ?? ""}`.toLowerCase();
      const gender = getGender(categoryName(product));

      return (
        (!search ||
          name.includes(search.toLowerCase()) ||
          description.includes(search.toLowerCase())) &&
        (selectedCategories.length === 0 ||
          selectedCategories.some((category) => isCategory(product, category))) &&
        (selectedGenders.length === 0 || selectedGenders.includes(gender)) &&
        (selectedSizes.length === 0 ||
          selectedSizes.some((size) => product.sizes?.includes(size))) &&
        (selectedColors.length === 0 ||
          selectedColors.some((color) => product.colors?.includes(color))) &&
        (maxPrice === 0 || productPrice(product) <= maxPrice)
      );
    });

    switch (sort) {
      case "price-low":
        result = result.sort((a, b) => productPrice(a) - productPrice(b));
        break;
      case "price-high":
        result = result.sort((a, b) => productPrice(b) - productPrice(a));
        break;
      case "name":
        result = result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }
    return result;
  }, [
    products,
    search,
    selectedCategories,
    selectedGenders,
    selectedSizes,
    selectedColors,
    maxPrice,
    sort,
  ]);

  const pageCount = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const visibleProducts = filteredProducts.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  function toggleSelection(
    value: string,
    current: string[],
    setter: (next: string[]) => void
  ) {
    setter(
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setSelectedCategories([]);
    setSelectedGenders([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setMaxPrice(0);
    setSort("latest");
    setPage(1);
  }

  function addProductToCart(product: ArrivalProduct) {
    const color = selectedProductColors[product._id] ?? product.colors?.[0];
    const price = productPrice(product);
    addToCart({
      _id: product._id,
      name: product.name,
      slug: product.slug,
      image: productImage(product),
      price,
      size: product.sizes?.[0],
      color,
      quantity: 1,
    });
  }

  const sidebar = (
    <div className="space-y-7">
      {categories.length > 0 && (
        <FilterGroup title="Category">
          {categories.map((category) => (
            <FilterCheckbox
              key={category}
              label={category}
              checked={selectedCategories.includes(category)}
              onChange={() =>
                toggleSelection(category, selectedCategories, setSelectedCategories)
              }
            />
          ))}
        </FilterGroup>
      )}

      <FilterGroup title="Gender">
        {["Men", "Women", "Girls", "Boys"].map((gender) => (
          <FilterCheckbox
            key={gender}
            label={gender}
            checked={selectedGenders.includes(gender)}
            onChange={() =>
              toggleSelection(gender, selectedGenders, setSelectedGenders)
            }
          />
        ))}
      </FilterGroup>

      <section className="border-b border-[#e8e2dc] pb-6">
        <h3 className="mb-4 text-sm font-semibold text-[#102d40]">Price range</h3>
        <label htmlFor="price-filter" className="sr-only">
          Maximum price in rupees
        </label>
        <input
          id="price-filter"
          type="range"
          min="0"
          max={priceCeiling}
          step={Math.max(100, Math.round(priceCeiling / 100))}
          value={maxPrice || priceCeiling}
          onChange={(event) => {
            setMaxPrice(Number(event.target.value));
            setPage(1);
          }}
          className="w-full accent-[#102d40]"
        />
        <div className="mt-2 flex justify-between text-xs text-[#64727b]">
          <span>Rs. 0</span>
          <span>Up to Rs. {(maxPrice || priceCeiling).toLocaleString()}</span>
        </div>
      </section>

      {sizes.length > 0 && (
        <FilterGroup title="Size">
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                aria-pressed={selectedSizes.includes(size)}
                onClick={() => toggleSelection(size, selectedSizes, setSelectedSizes)}
                className={`min-w-9 rounded border px-2.5 py-1.5 text-xs transition ${
                  selectedSizes.includes(size)
                    ? "border-[#102d40] bg-[#102d40] text-white"
                    : "border-[#ddd8d2] bg-white text-[#465560] hover:border-[#102d40]"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </FilterGroup>
      )}

      {colors.length > 0 && (
        <FilterGroup title="Color">
          <div className="space-y-2">
            {colors.map((color) => (
              <FilterCheckbox
                key={color}
                label={color}
                checked={selectedColors.includes(color)}
                onChange={() =>
                  toggleSelection(color, selectedColors, setSelectedColors)
                }
                swatch={colorHex(color)}
              />
            ))}
          </div>
        </FilterGroup>
      )}

    </div>
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[#fffdfa] text-[#172f3f]">
      <section className="bg-white">
        <nav
          aria-label="Breadcrumb"
          className="mx-auto flex max-w-[1894px] items-center gap-1.5 px-4 py-3 text-xs text-[#303030] sm:px-6"
        >
          <Link href="/" className="hover:text-[#6f1d46]">
            Home
          </Link>
          <ChevronRight size={13} aria-hidden="true" />
          <span className="font-medium">New Arrivals</span>
        </nav>
        <div className="relative mx-auto aspect-[3.2/1] min-h-[150px] max-h-[590px] w-full max-w-[1894px] overflow-hidden bg-[#f4f1ed]">
          {heroImage && (
            <Image
              src={heroImage}
              alt="New arrivals collection"
              fill
              priority
              sizes="100vw"
              className="object-contain"
            />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-black">
            <h1
              className="text-[clamp(3rem,10vw,9rem)] font-normal italic leading-[0.78] tracking-tight"
              style={{ fontFamily: '"Segoe Script", "Brush Script MT", cursive' }}
            >
              New Arrivals
            </h1>
            <p className="mt-2 text-[clamp(0.6rem,1.5vw,1.4rem)] font-medium tracking-[0.08em]">
              FRESH STYLES, JUST LANDED
            </p>
          </div>
        </div>
      </section>

      {sectionTiles && sectionTiles.length > 0 && (
        <section
          aria-labelledby="new-arrivals-categories-title"
          className="bg-white px-4 py-8 sm:px-6 sm:py-10 lg:py-12"
        >
          <div className="mx-auto max-w-5xl">
            <h2
              id="new-arrivals-categories-title"
              className="mb-6 text-center text-2xl font-medium tracking-wide text-[#171717] sm:mb-8 sm:text-3xl"
            >
              NEW ARRIVALS
            </h2>
            <div className="grid grid-cols-2 justify-items-center gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-9 lg:grid-cols-4">
              {sectionTiles.map((tile, index) => (
                <Link
                  key={`${tile.title}-${index}`}
                  href={`/shop?category=${encodeURIComponent(tile.category)}`}
                  className="group flex w-full max-w-48 flex-col items-center text-center"
                >
                  <span className="relative block aspect-square w-32 overflow-hidden rounded-full bg-[#f5f2ed] sm:w-36 lg:w-40">
                    <Image
                      src={tile.image}
                      alt={tile.title}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 128px, 160px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </span>
                  <span className="mt-3 text-xs font-medium uppercase tracking-wide text-[#171717] sm:text-sm">
                    {tile.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section
        aria-label="Shopping benefits"
        className="border-b border-[#e9e3dc] bg-[#fbf8f3]"
      >
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 px-4 py-3 sm:grid-cols-4 sm:px-8 sm:py-5 lg:px-14">
          {benefits.map(({ Icon, title, detail }, index) => (
            <div
              key={title}
              className={`flex items-center gap-2.5 px-2 py-3 sm:gap-3 sm:px-4 ${
                index > 0 ? "sm:border-l sm:border-[#e4ddd5]" : ""
              }`}
            >
              <Icon
                size={23}
                strokeWidth={1.5}
                aria-hidden="true"
                className="shrink-0 text-[#102d40] sm:size-7"
              />
              <p className="text-[10px] leading-4 text-[#6d777c] sm:text-xs">
                <span className="block font-semibold text-[#18374b]">{title}</span>
                <span>{detail}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="new-arrival-products"
        className="mx-auto max-w-[1440px] px-4 pb-16 pt-9 sm:px-7 sm:pt-12 lg:px-14"
      >
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-[#778188]">
          <Link href="/" className="hover:text-[#102d40]">
            Home
          </Link>
          <ChevronRight
            size={13}
            aria-hidden="true"
            className="mx-1 inline-block"
          />
          <span className="font-medium text-[#102d40]">New Arrivals</span>
        </nav>

        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-[#e8e2dc] pb-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9a8267]">
              Just arrived
            </p>
            <h2 className="mt-1 font-serif text-3xl text-[#102d40] sm:text-4xl">
              New Arrivals
            </h2>
          </div>
          <label className="relative flex h-10 w-full items-center sm:max-w-[260px]">
            <span className="sr-only">Search new arrivals</span>
            <Search
              size={16}
              aria-hidden="true"
              className="absolute left-3 text-[#7a858c]"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search new arrivals"
              className="h-full w-full rounded-sm border border-[#e4ded7] bg-white pl-9 pr-3 text-xs outline-none focus:border-[#102d40]"
            />
          </label>
        </div>

        <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                aria-expanded={filtersOpen}
                aria-controls="new-arrivals-filter-drawer"
                className="inline-flex min-h-9 items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#172a33] hover:text-primary"
              >
                <SlidersHorizontal size={15} aria-hidden="true" />
                Filter
              </button>
              <div className="ml-auto flex flex-wrap items-center gap-3 sm:gap-5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-600 sm:text-xs">
                  {isLoading ? "Loading products…" : `${filteredProducts.length} products`}
                </p>
                <label className="flex items-center gap-2 text-xs text-[#626e74]">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-slate-600 sm:text-xs">
                    Sort by
                  </span>
                  <span className="relative">
                    <select
                      value={sort}
                      onChange={(event) => {
                        setSort(event.target.value);
                        setPage(1);
                      }}
                      className="appearance-none rounded-md border border-slate-300 bg-white py-2 pl-3 pr-8 text-[10px] font-medium uppercase text-slate-700 outline-none focus:border-[#2867b2] sm:text-xs"
                    >
                      <option value="latest">Newest</option>
                      <option value="price-low">Price: low to high</option>
                      <option value="price-high">Price: high to low</option>
                      <option value="name">Name: A to Z</option>
                    </select>
                    <ChevronDown
                      size={13}
                      aria-hidden="true"
                      className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
                    />
                  </span>
                </label>
                <div className="flex rounded-sm border border-[#ddd8d2] bg-white">
                  <button
                    type="button"
                    onClick={() => setView("grid")}
                    aria-label="Grid view"
                    aria-pressed={view === "grid"}
                    className={`flex size-9 items-center justify-center ${
                      view === "grid" ? "bg-[#102d40] text-white" : "text-[#53636c]"
                    }`}
                  >
                    <Grid2X2 size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    aria-label="List view"
                    aria-pressed={view === "list"}
                    className={`flex size-9 items-center justify-center ${
                      view === "list" ? "bg-[#102d40] text-white" : "text-[#53636c]"
                    }`}
                  >
                    <List size={17} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            {loadError ? (
              <div
                role="alert"
                className="rounded-sm border border-red-200 bg-white px-5 py-12 text-center"
              >
                <h3 className="font-serif text-2xl text-[#102d40]">
                  We couldn’t load the new arrivals
                </h3>
                <p className="mt-2 text-sm text-[#68767d]">{loadError}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-5 text-xs font-semibold text-[#102d40] underline underline-offset-4"
                >
                  Try again
                </button>
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="aspect-[0.88] animate-pulse rounded-xl bg-slate-100"
                  />
                ))}
              </div>
            ) : visibleProducts.length === 0 ? (
              <div className="col-span-full rounded-xl border border-slate-200 bg-white px-5 py-16 text-center">
                <h3 className="font-serif text-2xl text-[#102d40]">
                  {products.length === 0
                    ? "New pieces are on their way"
                    : "No products match these filters"}
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#68767d]">
                  {products.length === 0
                    ? "There are no active products marked as new arrivals right now. Please check back soon."
                    : "Try adjusting your search or clear the selected filters to see more styles."}
                </p>
                {products.length > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 text-sm font-semibold text-[#2867b2] hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div
                className={
                  view === "grid"
                    ? "grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4"
                    : "flex flex-col gap-4"
                }
              >
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    layout={view}
                    selectedColor={selectedProductColors[product._id] ?? ""}
                    onSelectColor={(color) =>
                      setSelectedProductColors((current) => ({
                        ...current,
                        [product._id]: color,
                      }))
                    }
                    wished={isInWishlist(product._id)}
                    onToggleWishlist={() =>
                      toggleWishlist({
                        _id: product._id,
                        name: product.name,
                        slug: product.slug,
                        image: productImage(product),
                        price: productPrice(product),
                      })
                    }
                    onAddToCart={() => addProductToCart(product)}
                  />
                ))}
              </div>
            )}

            {pageCount > 1 && (
              <nav
                aria-label="Product pagination"
                className="mt-10 flex items-center justify-center gap-2"
              >
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => {
                    setPage((current) => Math.max(1, current - 1));
                    document
                      .getElementById("new-arrival-products")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  aria-label="Previous page"
                  className="flex size-9 items-center justify-center rounded-sm border border-[#ddd8d2] disabled:opacity-40"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                </button>
                {Array.from({ length: pageCount }).map((_, index) => {
                  const pageNumber = index + 1;
                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      aria-current={page === pageNumber ? "page" : undefined}
                      onClick={() => {
                        setPage(pageNumber);
                        document
                          .getElementById("new-arrival-products")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`size-9 rounded-sm border text-xs ${
                        page === pageNumber
                          ? "border-[#102d40] bg-[#102d40] text-white"
                          : "border-[#ddd8d2] bg-white text-[#394e5a]"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={page === pageCount}
                  onClick={() => {
                    setPage((current) => Math.min(pageCount, current + 1));
                    document
                      .getElementById("new-arrival-products")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  aria-label="Next page"
                  className="flex size-9 items-center justify-center rounded-sm border border-[#ddd8d2] disabled:opacity-40"
                >
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </nav>
            )}
        </div>
      </section>

      {filtersOpen && (
        <div className="fixed inset-0 z-[1000]">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          <section
            id="new-arrivals-filter-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-arrivals-filter-title"
            className="absolute inset-0 flex h-full w-full flex-col bg-white shadow-2xl sm:left-auto sm:w-[min(100%,560px)]"
          >
            <header className="flex h-14 shrink-0 items-center justify-center border-b border-[#e7e7e7]">
              <h2
                id="new-arrivals-filter-title"
                className="text-base font-semibold text-[#171717]"
              >
                Filter
              </h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                className="absolute right-4 top-3 flex size-8 items-center justify-center text-[#333] hover:text-black"
              >
                <X size={25} strokeWidth={1.4} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">{sidebar}</div>
            <footer className="grid shrink-0 grid-cols-2 gap-3 border-t border-[#e7e7e7] bg-white px-5 py-4">
              <button
                type="button"
                onClick={clearFilters}
                className="min-h-11 border border-[#222] text-xs font-semibold uppercase tracking-wide text-[#222]"
              >
                Remove all
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="min-h-11 bg-[#222] text-xs font-semibold uppercase tracking-wide text-white"
              >
                Apply
              </button>
            </footer>
          </section>
        </div>
      )}

      <section className="mx-auto grid max-w-[1440px] gap-4 px-4 pb-14 sm:grid-cols-2 sm:px-7 lg:grid-cols-[1fr_1fr_0.85fr] lg:px-14">
        <CollectionPromo
          title="Modern Menswear"
          description="Everyday essentials, made to move with you."
          href="/shop?category=Men"
          image={products.find((product) => getGender(categoryName(product)) === "Men")}
          tone="from-[#d8dedb] to-[#aeb8b5]"
        />
        <CollectionPromo
          title="A Softer Statement"
          description="Fresh looks for the moments that matter."
          href="/shop?category=Women"
          image={products.find((product) => getGender(categoryName(product)) === "Women")}
          tone="from-[#e7d9ce] to-[#c4aa96]"
        />
        <div className="flex min-h-[230px] flex-col justify-center rounded-sm bg-[#102d40] p-7 text-white sm:col-span-2 lg:col-span-1">
          <ShieldCheck size={29} strokeWidth={1.5} aria-hidden="true" />
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.19em] text-[#d1bfa9]">
            Made for the everyday
          </p>
          <h2 className="mt-2 font-serif text-3xl leading-tight">
            Quality you can feel.
          </h2>
          <p className="mt-3 max-w-sm text-xs leading-5 text-white/75">
            Discover thoughtful details, comfortable fabrics, and timeless
            pieces that work hard in your wardrobe.
          </p>
          <Link
            href="/about"
            className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-white hover:text-[#d1bfa9]"
          >
            Our promise <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <button
        type="button"
        onClick={() => setChatOpen((open) => !open)}
        aria-expanded={chatOpen}
        aria-label={chatOpen ? "Close help panel" : "Open help panel"}
        className="fixed bottom-5 right-5 z-40 flex size-12 items-center justify-center rounded-full bg-[#102d40] text-white shadow-lg transition hover:bg-[#1b465f] sm:bottom-7 sm:right-7 sm:size-14"
      >
        {chatOpen ? (
          <X size={21} aria-hidden="true" />
        ) : (
          <Headset size={22} aria-hidden="true" />
        )}
      </button>
      {chatOpen && (
        <div
          role="dialog"
          aria-label="Customer support"
          className="fixed bottom-[76px] right-5 z-40 w-[min(320px,calc(100vw-40px))] rounded-sm border border-[#e2ddd6] bg-white p-5 shadow-xl sm:bottom-[92px] sm:right-7"
        >
          <h2 className="font-serif text-xl text-[#102d40]">Need a hand?</h2>
          <p className="mt-2 text-xs leading-5 text-[#65727a]">
            Live chat isn’t available right now. Our contact page has the
            available ways to reach ClothesTown.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#102d40] underline underline-offset-4"
          >
            Contact us <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      )}
    </main>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-[#e8e2dc] pb-6">
      <h3 className="mb-4 text-sm font-semibold text-[#102d40]">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

function FilterCheckbox({
  label,
  checked,
  onChange,
  swatch,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  swatch?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-xs text-[#55636b]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-3.5 accent-[#102d40]"
      />
      {swatch && (
        <span
          aria-hidden="true"
          className="size-3.5 rounded-full border border-black/10"
          style={{ backgroundColor: swatch }}
        />
      )}
      {label}
    </label>
  );
}

function ProductCard({
  product,
  layout,
  selectedColor,
  onSelectColor,
  wished,
  onToggleWishlist,
  onAddToCart,
}: {
  product: ArrivalProduct;
  layout: "grid" | "list";
  selectedColor: string;
  onSelectColor: (color: string) => void;
  wished: boolean;
  onToggleWishlist: () => void;
  onAddToCart: () => void;
}) {
  const image = productImage(product);
  const price = productPrice(product);
  const onSale = productIsOnSale(product);
  const productColors = product.colors ?? [];

  return (
    <article
      className={`group min-w-0 overflow-hidden ${
        layout === "list"
          ? "grid grid-cols-[38%_1fr] gap-4 border-b border-[#e8e2dc] bg-white pb-4 sm:grid-cols-[220px_1fr] sm:gap-6"
          : "rounded-xl border border-[#e3eaf0] bg-white p-2 shadow-[0_2px_10px_rgba(25,55,78,0.04)] transition hover:-translate-y-0.5 hover:shadow-md sm:p-3"
      }`}
    >
      <div
        className={`relative overflow-hidden ${
          layout === "list"
            ? "aspect-[0.82] rounded-sm bg-[#f0ece6]"
            : "aspect-[0.88] rounded-lg bg-[#f5f7f8]"
        }`}
      >
        {image ? (
          <Link
            href={`/product/${product.slug}`}
            aria-label={`View ${product.name}`}
            className="absolute inset-0"
          >
            <Image
              src={image}
              alt={product.name}
              fill
              sizes={
                layout === "list"
                  ? "(max-width: 640px) 38vw, 220px"
                  : "(max-width: 640px) 48vw, (max-width: 1280px) 30vw, 270px"
              }
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </Link>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-[#758087]">
            Image unavailable
          </div>
        )}
        {(onSale || product.newArrival) && (
          <span className="absolute left-2 top-2 rounded-sm bg-red-600 px-2 py-1 text-[9px] font-bold uppercase text-white">
            {onSale ? "Sale" : "New"}
          </span>
        )}
        <button
          type="button"
          onClick={onToggleWishlist}
          aria-label={
            wished
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          aria-pressed={wished}
          className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm transition hover:text-red-500"
        >
          <Heart
            size={16}
            aria-hidden="true"
            className={wished ? "fill-red-500 text-red-500" : ""}
          />
        </button>
      </div>

      <div className={`px-1 pb-1 pt-3 ${layout === "list" ? "sm:pt-2" : ""}`}>
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-1 text-xs font-semibold text-[#20394c] hover:text-[#2867b2] sm:text-sm"
        >
          {product.name}
        </Link>
        <p className="mt-1 text-[10px] text-slate-500">
          {categoryName(product)}
          {product.sizes?.length ? ` · ${product.sizes.join(", ")}` : ""}
        </p>
        {product.shortDescription && layout === "list" && (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#6b777e]">
            {product.shortDescription}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-xs font-bold text-[#142d40] sm:text-sm">
            Rs. {price.toLocaleString()}
          </span>
          {onSale && (
            <span className="text-[10px] text-slate-400 line-through">
              Rs. {product.price.toLocaleString()}
            </span>
          )}
        </div>

        {productColors.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5">
            {productColors.slice(0, 6).map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                aria-label={`Select ${color}`}
                aria-pressed={selectedColor === color}
                onClick={() => onSelectColor(color)}
                className={`flex size-5 items-center justify-center rounded-full border ${
                  selectedColor === color
                    ? "border-[#102d40]"
                    : "border-transparent"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="size-3.5 rounded-full border border-black/10"
                  style={{ backgroundColor: colorHex(color) }}
                />
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          disabled={product.stock === 0}
          onClick={onAddToCart}
          className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-[#102f43] px-2 text-[10px] font-semibold text-white transition hover:bg-[#1c4d69] disabled:cursor-not-allowed disabled:bg-slate-300 sm:text-xs"
        >
          {product.stock === 0 ? (
            "Out of stock"
          ) : (
            <>
              Add to Cart <ArrowRight size={13} aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </article>
  );
}

function CollectionPromo({
  title,
  description,
  href,
  image,
  tone,
}: {
  title: string;
  description: string;
  href: string;
  image?: ArrivalProduct;
  tone: string;
}) {
  const src = image ? productImage(image) : "";
  return (
    <article
      className={`relative isolate flex min-h-[230px] overflow-hidden rounded-sm bg-gradient-to-br ${tone}`}
    >
      {src && (
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover object-center"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-[#152d3b]/85 via-[#152d3b]/50 to-transparent" />
      <div className="relative z-10 flex max-w-[340px] flex-col justify-center p-6 text-white sm:p-8">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/75">
          Explore the collection
        </p>
        <h2 className="mt-2 font-serif text-3xl">{title}</h2>
        <p className="mt-2 text-xs leading-5 text-white/85">{description}</p>
        <Link
          href={href}
          className="mt-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em]"
        >
          Shop now <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
