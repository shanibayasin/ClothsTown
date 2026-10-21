"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight, Heart, ShoppingCart, SlidersHorizontal } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { readJsonResponse } from "@/lib/api";

interface Product {
  _id: string;
  name: string;
  slug: string;
  images: string[];
  image?: string;
  price: number;
  discountPrice?: number;
  featured: boolean;
  newArrival: boolean;
  category: {
    _id: string;
    name: string;
  };
  collection?: {
    _id: string;
    title: string;
  };
  sizes?: string[];
  colors?: string[];
  stock: number;
}

interface Category {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
}

interface Collection {
  _id: string;
  title: string;
}

const ITEMS_PER_PAGE = 9;
const COLOR_OPTIONS = [
  { name: "Black", value: "#171717" },
  { name: "Navy", value: "#193655" },
  { name: "Gray", value: "#9ca3af" },
  { name: "Beige", value: "#cbb79b" },
  { name: "Green", value: "#47745b" },
  { name: "Brown", value: "#81513a" },
  { name: "White", value: "#ffffff" },
];

function getProductImage(product: Product) {
  return product.images?.[0] || product.image || "/images/placeholder-product.jpg";
}

function getProductPrice(product: Product) {
  return product.discountPrice && product.discountPrice > 0
    ? product.discountPrice
    : product.price;
}

function ShopLoading() {
  return (
    <div className="mx-auto min-h-[60vh] max-w-[1440px] animate-pulse px-4 py-8 sm:px-6">
      <div className="h-40 rounded-2xl bg-slate-200 sm:h-56" />
      <div className="mt-8 grid gap-5 md:grid-cols-[190px_1fr]">
        <div className="h-96 rounded-xl bg-slate-100" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-72 rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopLoading />}>
      <ShopRoute />
    </Suspense>
  );
}

function ShopRoute() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") ?? "";
  const categoryQuery = searchParams.get("category") ?? "";
  const saleQuery = searchParams.get("sale") ?? "";

  return (
    <ShopContent
      key={`${searchQuery}:${categoryQuery}:${saleQuery}`}
      searchQuery={searchQuery}
      categoryQuery={categoryQuery}
      saleQuery={saleQuery}
    />
  );
}

function ShopContent({
  searchQuery,
  categoryQuery,
  saleQuery,
}: {
  searchQuery: string;
  categoryQuery: string;
  saleQuery: string;
}) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState(categoryQuery.toLowerCase());
  const [sort, setSort] = useState("latest");
  const [selectedCollection, setSelectedCollection] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [priceRange, setPriceRange] = useState(100000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [saleOnly, setSaleOnly] = useState(saleQuery === "true");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/api/products")
      .then((res) => readJsonResponse<Product[]>(res, []))
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch((error: unknown) => {
        console.error("Failed to load shop products:", error);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    fetch("/api/categories")
      .then((res) => readJsonResponse<Category[]>(res, []))
      .then((data) => {
        if (active) setCategories(data);
      })
      .catch((error: unknown) => {
        console.error("Failed to load shop categories:", error);
      });

    fetch("/api/collections")
      .then((res) => readJsonResponse<Collection[]>(res, []))
      .then((data) => {
        if (active) setCollections(data);
      })
      .catch((error: unknown) => {
        console.error("Failed to load shop collections:", error);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const filteredProducts = useMemo(() => {
    let data = [...products];

    if (search) {
      data = data.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (saleOnly) {
      data = data.filter(
        (item) =>
          typeof item.discountPrice === "number" &&
          item.discountPrice > 0 &&
          item.discountPrice < item.price
      );
    }

    if (selectedCategory) {
      data = data.filter((item) => {
        if (item.category?._id === selectedCategory) return true;
        const categoryName = item.category?.name.toLowerCase() ?? "";
        if (selectedCategory === "men") return /\bmen\b|mens/.test(categoryName);
        if (selectedCategory === "women") return /\bwomen\b|womens/.test(categoryName);
        return categoryName === selectedCategory;
      });
    }

    if (selectedCollection) {
      data = data.filter((item) => item.collection?._id === selectedCollection);
    }

    if (selectedSize) {
      data = data.filter((item) => item.sizes?.includes(selectedSize));
    }

    if (selectedColor) {
      data = data.filter((item) => item.colors?.includes(selectedColor));
    }

    data = data.filter((item) => getProductPrice(item) <= priceRange);

    if (inStockOnly) {
      data = data.filter((item) => item.stock > 0);
    }

    switch (sort) {
      case "low":
        data.sort((a, b) => getProductPrice(a) - getProductPrice(b));
        break;
      case "high":
        data.sort((a, b) => getProductPrice(b) - getProductPrice(a));
        break;
      case "name":
        data.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return data;
  }, [
    products,
    search,
    selectedCategory,
    selectedCollection,
    selectedSize,
    selectedColor,
    priceRange,
    inStockOnly,
    saleOnly,
    sort,
  ]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(
    () =>
      filteredProducts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
      ),
    [filteredProducts, currentPage]
  );
  const matchesCategoryQuery = (category: Category, query: string) => {
    const normalizedQuery = query.trim().toLowerCase();
    const name = category.name.toLowerCase();
    const slug = category.slug?.toLowerCase();
    return (
      name === normalizedQuery ||
      slug === normalizedQuery ||
      (normalizedQuery === "men" && /\bmen\b|mens/.test(name)) ||
      (normalizedQuery === "women" && /\bwomen\b|womens/.test(name))
    );
  };
  const activeCategory = categories.find(
    (item) => item._id === selectedCategory || matchesCategoryQuery(item, selectedCategory)
  );
  const categoryName =
    activeCategory?.name ||
    (categoryQuery.toLowerCase() === "men"
      ? "Men"
      : categoryQuery.toLowerCase() === "women"
        ? "Women"
        : categoryQuery || "All Products");
  const heroTitle = /^men('?s)?$/i.test(categoryName)
    ? "Men's Wear"
    : /^women('?s)?$/i.test(categoryName)
      ? "Women's Wear"
      : categoryName === "All Products"
        ? "Shop All Products"
        : categoryName;
  const categoryHeroProduct = products.find(
    (product) => product.category?._id === activeCategory?._id
  );
  const heroImage =
    activeCategory?.image ||
    (categoryHeroProduct ? getProductImage(categoryHeroProduct) : undefined) ||
    products[0]?.images?.[0] ||
    products[0]?.image;

  function resetFilters() {
    setSearch("");
    setSelectedCategory("");
    setSelectedCollection("");
    setSelectedSize("");
    setSelectedColor("");
    setPriceRange(100000);
    setInStockOnly(false);
    setSaleOnly(false);
    setSort("latest");
    setCurrentPage(1);
  }

  return (
    <main className="min-h-screen bg-[#f7f9fb] pb-12 text-[#172b3a]">
      <section className="relative mx-auto h-[190px] max-w-[1440px] overflow-hidden bg-gradient-to-r from-[#d8eafb] via-[#e9f3fb] to-[#a9c4da] sm:h-[230px] lg:h-[280px]">
        {heroImage && (
          <div className="absolute inset-y-0 right-0 w-[62%]">
            <Image
              src={heroImage}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 60vw, 800px"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#e6f1fa] via-[#e6f1fa]/50 to-transparent" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-white/35 to-transparent" />
        <div className="relative mx-auto flex h-full max-w-[1440px] flex-col justify-center px-5 sm:px-8 lg:px-12">
          <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs text-[#526c7e]">
            <Link href="/" className="hover:text-[#102633]">Home</Link>
            <ChevronRight size={13} aria-hidden="true" />
            <span>Shop</span>
            <ChevronRight size={13} aria-hidden="true" />
            <span className="font-semibold text-[#20394c]">{heroTitle}</span>
          </nav>
          <h1 className="max-w-[56%] text-3xl font-bold tracking-tight text-[#142d40] sm:text-4xl lg:text-5xl">
            {heroTitle}
          </h1>
          <p className="mt-2 max-w-[48%] text-xs text-[#526c7e] sm:text-sm">
            Premium quality. Timeless style.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <p className="text-sm font-semibold">
            {filteredProducts.length} Products
          </p>
          <button
            type="button"
            onClick={() => setShowFilters((open) => !open)}
            aria-expanded={showFilters}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium"
          >
            <SlidersHorizontal size={16} />
            {showFilters ? "Hide filters" : "Filters"}
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-8">
          <aside
            className={`${showFilters ? "block" : "hidden"} space-y-5 lg:sticky lg:top-6 lg:block lg:self-start`}
          >
            <div className="border-b border-slate-200 pb-4">
              <h2 className="mb-3 text-sm font-bold">Categories</h2>
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                  <input
                    type="radio"
                    name="shop-category"
                    checked={!selectedCategory}
                    onChange={() => {
                      setSelectedCategory("");
                      setCurrentPage(1);
                    }}
                    className="accent-[#102f43]"
                  />
                  All Products
                </label>
                {categories.map((category) => (
                  <label key={category._id} className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                    <input
                      type="radio"
                      name="shop-category"
                      checked={
                        selectedCategory === category._id ||
                        matchesCategoryQuery(category, selectedCategory)
                      }
                      onChange={() => {
                        setSelectedCategory(category._id);
                        setCurrentPage(1);
                      }}
                      className="accent-[#102f43]"
                    />
                    {category.name}
                  </label>
                ))}
              </div>
            </div>

            {collections.length > 0 && (
              <div className="border-b border-slate-200 pb-4">
                <h2 className="mb-3 text-sm font-bold">Collections</h2>
                <div className="space-y-2">
                  {collections.map((collection) => (
                    <label key={collection._id} className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                      <input
                        type="radio"
                        name="shop-collection"
                        checked={selectedCollection === collection._id}
                        onChange={() => {
                          setSelectedCollection(collection._id);
                          setCurrentPage(1);
                        }}
                        className="accent-[#102f43]"
                      />
                      {collection.title}
                    </label>
                  ))}
                  {selectedCollection && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCollection("");
                        setCurrentPage(1);
                      }}
                      className="text-xs font-medium text-[#2867b2] hover:underline"
                    >
                      Clear collection
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="border-b border-slate-200 pb-4">
              <label htmlFor="shop-search" className="mb-2 block text-sm font-bold">
                Search
              </label>
              <input
                id="shop-search"
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search products"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#2867b2]"
              />
            </div>

            <div className="border-b border-slate-200 pb-4">
              <h2 className="mb-3 text-sm font-bold">Size</h2>
              <div className="flex flex-wrap gap-2">
                {["S", "M", "L", "XL", "XXL"].map((size) => (
                  <button
                    type="button"
                    key={size}
                    aria-pressed={selectedSize === size}
                    onClick={() => {
                      setSelectedSize(selectedSize === size ? "" : size);
                      setCurrentPage(1);
                    }}
                    className={`size-8 rounded border text-xs font-medium ${
                      selectedSize === size
                        ? "border-[#102f43] bg-[#102f43] text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-[#102f43]"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-b border-slate-200 pb-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-bold">Price Range</h2>
              </div>
              <input
                type="range"
                min={0}
                max={100000}
                step={500}
                value={priceRange}
                aria-label="Maximum price"
                onChange={(event) => {
                  setPriceRange(Number(event.target.value));
                  setCurrentPage(1);
                }}
                className="w-full accent-[#2867b2]"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Rs. 0 — Rs. {priceRange.toLocaleString()}
              </p>
            </div>

            <div className="border-b border-slate-200 pb-4">
              <h2 className="mb-3 text-sm font-bold">Colors</h2>
              <div className="space-y-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    type="button"
                    key={color.name}
                    aria-pressed={selectedColor === color.name}
                    onClick={() =>
                      {
                        setSelectedColor(selectedColor === color.name ? "" : color.name);
                        setCurrentPage(1);
                      }
                    }
                    className="flex items-center gap-2 text-xs text-slate-600"
                  >
                    <span
                      className={`size-3 rounded-full border border-slate-300 ${
                        selectedColor === color.name ? "ring-2 ring-[#2867b2] ring-offset-1" : ""
                      }`}
                      style={{ backgroundColor: color.value }}
                    />
                    {color.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(event) => {
                    setInStockOnly(event.target.checked);
                    setCurrentPage(1);
                  }}
                  className="accent-[#2867b2]"
                />
                In stock only
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={saleOnly}
                  onChange={(event) => {
                    setSaleOnly(event.target.checked);
                    setCurrentPage(1);
                  }}
                  className="accent-[#2867b2]"
                />
                On sale
              </label>
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-semibold text-[#2867b2] hover:underline"
              >
                Reset all filters
              </button>
            </div>
          </aside>

          <section aria-label={`${heroTitle} products`} className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold">
                All Products <span className="text-slate-500">({filteredProducts.length})</span>
              </p>
              <label className="flex items-center gap-2 text-xs text-slate-500">
                Sort by
                <span className="relative">
                  <select
                    value={sort}
                    onChange={(event) => {
                      setSort(event.target.value);
                      setCurrentPage(1);
                    }}
                    className="appearance-none rounded-md border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-medium text-slate-700 outline-none focus:border-[#2867b2]"
                  >
                    <option value="latest">Newest First</option>
                    <option value="low">Price: Low to High</option>
                    <option value="high">Price: High to Low</option>
                    <option value="name">Name A-Z</option>
                  </select>
                  <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
                </span>
              </label>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-[300px] animate-pulse rounded-xl bg-white sm:h-[370px]" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                {paginatedProducts.length === 0 ? (
                  <div className="col-span-full rounded-xl border border-slate-200 bg-white px-5 py-16 text-center">
                    <h2 className="text-xl font-semibold text-slate-800">No products found</h2>
                    <p className="mt-2 text-sm text-slate-500">Try changing your filters.</p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-4 text-sm font-semibold text-[#2867b2] hover:underline"
                    >
                      Reset filters
                    </button>
                  </div>
                ) : (
                  paginatedProducts.map((product) => {
                    const image = getProductImage(product);
                    const price = getProductPrice(product);
                    const onSale = price < product.price;
                    const wished = isInWishlist(product._id);

                    return (
                      <article
                        key={product._id}
                        className="group overflow-hidden rounded-xl border border-[#e3eaf0] bg-white p-2 shadow-[0_2px_10px_rgba(25,55,78,0.04)] transition hover:-translate-y-0.5 hover:shadow-md sm:p-3"
                      >
                        <div className="relative">
                          <Link
                            href={`/product/${product.slug}`}
                            aria-label={`View ${product.name}`}
                            className="relative block aspect-[0.88] overflow-hidden rounded-lg bg-[#f5f7f8]"
                          >
                            <Image
                              src={image}
                              alt={product.name}
                              fill
                              sizes="(max-width: 640px) 46vw, (max-width: 1280px) 30vw, 360px"
                              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            />
                          </Link>
                          {(onSale || product.newArrival) && (
                            <span className="absolute left-2 top-2 rounded-sm bg-red-600 px-2 py-1 text-[9px] font-bold uppercase text-white">
                              {onSale ? "Sale" : "New"}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              toggleWishlist({
                                _id: product._id,
                                name: product.name,
                                slug: product.slug,
                                image,
                                price,
                              })
                            }
                            aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                            aria-pressed={wished}
                            className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm transition hover:text-red-500"
                          >
                            <Heart size={15} className={wished ? "fill-red-500 text-red-500" : ""} />
                          </button>
                        </div>

                        <div className="px-1 pb-1 pt-3">
                          <Link
                            href={`/product/${product.slug}`}
                            className="line-clamp-1 text-xs font-semibold text-[#20394c] hover:text-[#2867b2] sm:text-sm"
                          >
                            {product.name}
                          </Link>
                          <p className="mt-1 text-[10px] text-slate-500">
                            {product.category?.name}
                            {product.sizes?.length ? ` · ${product.sizes.join(", ")}` : ""}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs font-bold text-[#142d40] sm:text-sm">
                              Rs. {price.toLocaleString()}
                            </span>
                            {onSale && (
                              <span className="text-[10px] text-slate-400 line-through">
                                Rs. {product.price.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            disabled={product.stock <= 0}
                            onClick={() =>
                              addToCart({
                                _id: product._id,
                                name: product.name,
                                slug: product.slug,
                                image,
                                price,
                                quantity: 1,
                              })
                            }
                            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-[#102f43] py-2 text-[10px] font-semibold text-white transition hover:bg-[#1c4d69] disabled:cursor-not-allowed disabled:bg-slate-300 sm:text-xs"
                          >
                            <ShoppingCart size={13} />
                            {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            )}

            {totalPages > 1 && !isLoading && (
              <nav aria-label="Product pages" className="mt-8 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  aria-label="Previous page"
                  className="flex size-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
                >
                  <ChevronRight size={15} className="rotate-180" />
                </button>
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    type="button"
                    key={index}
                    onClick={() => setCurrentPage(index + 1)}
                    aria-current={currentPage === index + 1 ? "page" : undefined}
                    className={`size-8 rounded text-xs font-semibold ${
                      currentPage === index + 1
                        ? "bg-[#102f43] text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-[#102f43]"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  aria-label="Next page"
                  className="flex size-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
                >
                  <ChevronRight size={15} />
                </button>
              </nav>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
