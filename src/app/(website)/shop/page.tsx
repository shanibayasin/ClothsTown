"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
}

interface Collection {
  _id: string;
  title: string;
}

const ITEMS_PER_PAGE = 9;

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  // Filtering & Sorting State
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sort, setSort] = useState("latest");
  const [selectedCollection, setSelectedCollection] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [priceRange, setPriceRange] = useState(100000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [saleOnly, setSaleOnly] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadCollections();
  }, []);

  // Smooth scroll back up when switching pages
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [currentPage]);

  // Reset pagination back to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedCollection, selectedSize, selectedColor, priceRange, inStockOnly, saleOnly, sort]);

  async function loadProducts() {
    const res = await fetch("/api/products");
    const data = await readJsonResponse<Product[]>(res, []);
    setProducts(data);
  }

  async function loadCategories() {
    const res = await fetch("/api/categories");
    const data = await readJsonResponse<Category[]>(res, []);
    setCategories(data);

    const params = new URLSearchParams(window.location.search);
    setSearch(params.get("search") ?? "");
    setSaleOnly(params.get("sale") === "true");

    const requestedCategory = params.get("category")?.toLowerCase();
    if (requestedCategory) {
      const category = data.find(
        (item) => item.name.toLowerCase() === requestedCategory
      );
      if (category) setSelectedCategory(category._id);
    }
  }

  async function loadCollections() {
    const res = await fetch("/api/collections");
    const data = await readJsonResponse<Collection[]>(res, []);
    setCollections(data);
  }

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
      data = data.filter((item) => item.category?._id === selectedCategory);
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

    data = data.filter((item) => {
      const actualPrice = item.discountPrice ?? item.price;
      return actualPrice <= priceRange;
    });

    if (inStockOnly) {
      data = data.filter((item) => item.stock > 0);
    }

    switch (sort) {
      case "low":
        data.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
        break;
      case "high":
        data.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
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

  // Compute total available pages based on matches
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  // Chunk items assigned explicitly to the active screen index
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredProducts, currentPage]);

  // Loading Screen State (Skeleton Fallback)
  if (products.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border bg-white p-4"
            >
              <div className="h-80 rounded-xl bg-gray-200" />
              <div className="mt-5 h-6 rounded bg-gray-200" />
              <div className="mt-3 h-5 w-24 rounded bg-gray-200" />
              <div className="mt-6 h-12 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <h1 className="mb-10 text-4xl font-bold">Shop</h1>

      <div className="mb-6 lg:hidden">
        <button
          onClick={() => setShowFilters((prev) => !prev)}
          className="w-full rounded-xl bg-primary py-3 font-semibold text-white"
        >
          {showFilters ? "Hide Filters" : "Filter Products"}
        </button>
      </div>

      <div className="grid gap-10 lg:grid-cols-4">
        {/* Sidebar Controls */}
        <aside className={`space-y-8 ${showFilters ? "block" : "hidden"} lg:block lg:sticky lg:top-28 lg:h-fit`}>
          {/* Search */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Search</h3>
            <input
              type="text"
              placeholder="Search Products..."
              className="w-full rounded-xl border p-3"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Categories</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCategory("")}
                className={`block w-full rounded-lg px-3 py-2 text-left ${
                  selectedCategory === ""
                    ? "bg-primary text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat._id)}
                  className={`block w-full rounded-lg px-3 py-2 text-left ${
                    selectedCategory === cat._id
                      ? "bg-primary text-white"
                      : "hover:bg-gray-100"
                }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Collections */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Collections</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCollection("")}
                className={`block w-full rounded-lg px-3 py-2 text-left ${
                  selectedCollection === ""
                    ? "bg-primary text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                All Collections
              </button>
              {collections.map((item) => (
                <button
                  key={item._id}
                  onClick={() => setSelectedCollection(item._id)}
                  className={`block w-full rounded-lg px-3 py-2 text-left ${
                    selectedCollection === item._id
                      ? "bg-primary text-white"
                      : "hover:bg-gray-100"
                }`}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Colors</h3>
            <div className="flex flex-wrap gap-2">
              {["Black", "White", "Brown", "Beige", "Navy"].map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(selectedColor === color ? "" : color)}
                  className={`rounded-lg border px-4 py-2 transition ${
                    selectedColor === color
                      ? "bg-primary text-white"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Size</h3>
            <div className="flex flex-wrap gap-2">
              {["S", "M", "L", "XL", "XXL"].map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(selectedSize === size ? "" : size)}
                  className={`rounded-lg border px-4 py-2 transition ${
                    selectedSize === size
                      ? "bg-primary text-white"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Price Range</h3>
            <input
              type="range"
              min={0}
              max={100000}
              step={500}
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <p className="mt-2 text-sm text-gray-600">
              Up to Rs. {priceRange.toLocaleString()}
            </p>
          </div>

          {/* Stock Availability */}
          <div className="pb-4">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="h-4 w-4 rounded accent-primary"
              />
              <span className="text-sm font-medium text-gray-700">In Stock Only</span>
            </label>
          </div>

          {/* Master Reset Button */}
          <button
            onClick={() => {
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
            }}
            className="w-full rounded-xl bg-primary py-3 font-semibold text-white transition hover:bg-primary-dark"
          >
            Reset Filters
          </button>
        </aside>

        {/* Main Content Display Area */}
        <div className="lg:col-span-3">
          {/* Sorting / Meta Header */}
          <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <p className="text-gray-600">
              {filteredProducts.length} {filteredProducts.length === 1 ? "Product" : "Products"} Found
            </p>

            <select
              className="rounded-xl border p-3 bg-white"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="latest">Latest</option>
              <option value="low">Price Low → High</option>
              <option value="high">Price High → Low</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>

          {/* Products Chunk Grid Routing */}
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {paginatedProducts.length === 0 ? (
              <div className="col-span-full rounded-2xl border py-20 text-center bg-white">
                <h2 className="text-3xl font-bold text-gray-800">No Products Found</h2>
                <p className="mt-3 text-gray-500">Try changing your filters.</p>
              </div>
            ) : (
              paginatedProducts.map((product) => (
                <div
                  key={product._id}
                  className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative h-80 bg-gray-50">
                    <Image
                      src={product.images?.[0] || product.image || "/images/placeholder-product.jpg"}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />

                    {product.newArrival && (
                      <span className="absolute left-3 top-3 rounded-full bg-green-600 px-3 py-1 text-xs text-white uppercase font-medium tracking-wide">
                        NEW
                      </span>
                    )}

                    {product.featured && (
                      <span className="absolute right-3 top-3 rounded-full bg-primary px-3 py-1 text-xs text-white uppercase font-medium tracking-wide">
                        Featured
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <h2 className="text-xl font-semibold text-gray-800 line-clamp-1">
                      {product.name}
                    </h2>
                    <p className="mt-1 text-sm text-gray-400">
                      {product.category?.name}
                    </p>

                    <div className="mt-4 flex items-center gap-3">
                      {product.discountPrice ? (
                        <>
                          <span className="font-bold text-primary">
                            Rs. {product.discountPrice.toLocaleString()}
                          </span>
                          <span className="text-gray-400 line-through text-sm">
                            Rs. {product.price.toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <span className="font-bold text-primary">
                          Rs. {product.price.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/product/${product.slug}`}
                      className="mt-5 block rounded-xl bg-primary py-3 text-center font-semibold text-white hover:bg-primary-dark transition"
                    >
                      View Product
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Navigation Controls */}
          {totalPages > 1 && (
            <div className="mt-14 flex items-center justify-center gap-3">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="rounded-lg border px-5 py-3 font-medium transition hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`h-12 w-12 rounded-lg font-semibold transition ${
                    currentPage === index + 1
                      ? "bg-primary text-white shadow-md"
                      : "border hover:bg-gray-50"
                  }`}
                >
                  {index + 1}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="rounded-lg border px-5 py-3 font-medium transition hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}