"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Package,
  Pencil,
  SlidersHorizontal,
  Star,
  Trash2,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { getCanonicalProductFields } from "@/lib/products";

type ProductStatus = "active" | "draft" | "inactive";

export interface AdminProduct {
  _id: string;
  name: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  sku?: string;
  images?: string[];
  sizes?: string[];
  colors?: string[];
  category?: string | { _id: string; name?: string };
  collection?: string | { _id: string; title?: string };
  collections?: Array<string | { _id: string; title?: string }>;
  price: number;
  discountPrice?: number;
  stock?: number;
  season?: string;
  fabric?: string;
  brand?: string;
  productType?: string;
  fragranceType?: string;
  bottleSize?: string;
  featured?: boolean;
  isFeatured?: boolean;
  onSale?: boolean;
  newArrival?: boolean;
  isNewArrival?: boolean;
  status?: boolean | string;
  publicationStatus?: ProductStatus;
}

interface Props {
  refresh: number;
  onEdit: (product: AdminProduct) => void;
  sectionName?: string;
  categoryId?: string;
  categoryIds?: string[];
  newArrivalOnly?: boolean;
}

interface ProductResponse {
  products: AdminProduct[];
  total: number;
  page: number;
  totalPages: number;
  counts: Record<ProductStatus, number>;
  filters?: {
    sizes?: string[];
    colors?: string[];
    brands?: string[];
    fabrics?: string[];
    productTypes?: string[];
  };
}

const PAGE_SIZE = 20;
const EMPTY_COUNTS: Record<ProductStatus, number> = {
  active: 0,
  draft: 0,
  inactive: 0,
};

function getStatus(product: AdminProduct): ProductStatus {
  return getCanonicalProductFields(product).publicationStatus;
}

function statusClass(status: ProductStatus) {
  if (status === "active") return "bg-emerald-50 text-emerald-700";
  if (status === "draft") return "bg-amber-50 text-amber-700";
  return "bg-rose-50 text-rose-700";
}

function getColorSwatch(color: string) {
  const normalized = color.trim().toLowerCase();
  const namedColors: Record<string, string> = {
    beige: "#d6c2a1",
    black: "#171717",
    blue: "#2563eb",
    brown: "#8b5e3c",
    cream: "#f5f0e5",
    gold: "#d4af37",
    gray: "#9ca3af",
    grey: "#9ca3af",
    green: "#16a34a",
    maroon: "#7f1d1d",
    navy: "#193655",
    olive: "#84943e",
    orange: "#f97316",
    pink: "#ec4899",
    purple: "#9333ea",
    red: "#dc2626",
    silver: "#cbd5e1",
    white: "#ffffff",
    yellow: "#eab308",
  };
  if (/^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(normalized)) return normalized;
  return namedColors[normalized] ?? "#94a3b8";
}

export default function ProductTable({
  refresh,
  onEdit,
  sectionName = "All",
  categoryId,
  categoryIds,
  newArrivalOnly = false,
}: Props) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Array<{ _id: string; name: string }>>([]);
  const [collections, setCollections] = useState<Array<{ _id: string; title: string }>>([]);
  const [counts, setCounts] = useState<Record<ProductStatus, number>>(EMPTY_COUNTS);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [availableFabrics, setAvailableFabrics] = useState<string[]>([]);
  const [availableProductTypes, setAvailableProductTypes] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [collectionFilter, setCollectionFilter] = useState("");
  const [minimumPrice, setMinimumPrice] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [fabricFilter, setFabricFilter] = useState("");
  const [productTypeFilter, setProductTypeFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState(false);
  const [newArrivalFilter, setNewArrivalFilter] = useState(false);
  const [saleFilter, setSaleFilter] = useState(false);
  const [availableFilter, setAvailableFilter] = useState(false);
  const [sort, setSort] = useState("createdAt");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<ProductStatus>("active");
  const [bulkAction, setBulkAction] = useState<
    "status" | "featured-on" | "featured-off" | "arrival-on" | "arrival-off" | "delete"
  >("status");
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const categoryIdsValue = categoryIds?.join(",") ?? "";
  const showCategoryColumn = (!categoryId && !categoryIds?.length) || sectionName === "Men";
  const tableColumnCount = showCategoryColumn ? 10 : 9;

  useEffect(() => {
    let active = true;
    void Promise.all([
      fetch("/api/categories", { cache: "no-store" }),
      fetch("/api/collections", { cache: "no-store" }),
    ])
      .then(async ([categoryResponse, collectionResponse]) => {
        if (!categoryResponse.ok || !collectionResponse.ok) {
          throw new Error("Could not load product filter options.");
        }
        const [categoryData, collectionData] = await Promise.all([
          categoryResponse.json(),
          collectionResponse.json(),
        ]);
        if (!active) return;
        if (!categoryId && !categoryIdsValue) {
          setCategories(
            Array.isArray(categoryData)
              ? categoryData.filter(
                  (item): item is { _id: string; name: string } =>
                    typeof item?._id === "string" && typeof item?.name === "string"
                )
              : []
          );
        }
        setCollections(
          Array.isArray(collectionData)
            ? collectionData.filter(
                (item): item is { _id: string; title: string } =>
                  typeof item?._id === "string" && typeof item?.title === "string"
              )
            : []
        );
      })
      .catch((loadError: unknown) => {
        console.error("Failed to load product categories:", loadError);
      });
    return () => {
      active = false;
    };
  }, [categoryId, categoryIdsValue]);

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({
      admin: "true",
      page: String(page),
      pageSize: String(PAGE_SIZE),
      sort,
      direction,
    });
    if (search.trim()) query.set("search", search.trim());
    if (status) query.set("status", status);
    if (collectionFilter) query.set("collectionId", collectionFilter);
    if (minimumPrice) query.set("minPrice", minimumPrice);
    if (maximumPrice) query.set("maxPrice", maximumPrice);
    if (sizeFilter) query.set("size", sizeFilter);
    if (colorFilter) query.set("color", colorFilter);
    if (brandFilter) query.set("brand", brandFilter);
    if (fabricFilter) query.set("fabric", fabricFilter);
    if (productTypeFilter) query.set("productType", productTypeFilter);
    if (featuredFilter) query.set("featured", "true");
    if (newArrivalOnly || newArrivalFilter) query.set("newArrival", "true");
    if (saleFilter) query.set("sale", "true");
    if (availableFilter) query.set("available", "true");
    if (categoryId) query.set("categoryId", categoryId);
    else if (categoryIdsValue) query.set("categoryId", categoryIdsValue);
    else if (categoryFilter) query.set("categoryId", categoryFilter);

    void adminFetch(`/api/products?${query.toString()}`, { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as Partial<ProductResponse> & { message?: string };
        if (!response.ok) throw new Error(data.message || "Failed to load products.");
        if (!active) return;
        setError("");
        setProducts(Array.isArray(data.products) ? data.products : []);
        setTotal(typeof data.total === "number" ? data.total : 0);
        setTotalPages(typeof data.totalPages === "number" ? data.totalPages : 1);
        if (typeof data.page === "number" && data.page !== page) {
          setPage(data.page);
        }
        setCounts(data.counts ?? { active: 0, draft: 0, inactive: 0 });
        setAvailableSizes(data.filters?.sizes ?? []);
        setAvailableColors(data.filters?.colors ?? []);
        setAvailableBrands(data.filters?.brands ?? []);
        setAvailableFabrics(data.filters?.fabrics ?? []);
        setAvailableProductTypes(data.filters?.productTypes ?? []);
        setSelectedIds([]);
      })
      .catch((loadError: unknown) => {
        console.error("Failed to load products:", loadError);
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load products.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    refresh,
    reload,
    page,
    search,
    status,
    sort,
    direction,
    newArrivalOnly,
    newArrivalFilter,
    saleFilter,
    availableFilter,
    featuredFilter,
    categoryId,
    categoryIdsValue,
    categoryFilter,
    collectionFilter,
    minimumPrice,
    maximumPrice,
    sizeFilter,
    colorFilter,
    brandFilter,
    fabricFilter,
    productTypeFilter,
  ]);

  const visibleIds = useMemo(() => products.map((product) => product._id), [products]);

  async function deleteProduct(id: string) {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    setBusy(true);
    setError("");
    setFeedback("");
    try {
      const response = await adminFetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete product.");
      setFeedback("Product deleted successfully.");
      setReload((current) => current + 1);
    } catch (deleteError) {
      console.error("Failed to delete product:", deleteError);
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete product.");
    } finally {
      setBusy(false);
    }
  }

  async function runBulkAction() {
    if (selectedIds.length === 0) return;
    if (
      bulkAction === "delete" &&
      !window.confirm(`Delete ${selectedIds.length} selected products? This cannot be undone.`)
    ) {
      return;
    }

    setBusy(true);
    setError("");
    setFeedback("");
    try {
      const response = await adminFetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          action: bulkAction === "featured-on" || bulkAction === "featured-off"
            ? "featured"
            : bulkAction === "arrival-on" || bulkAction === "arrival-off"
              ? "newArrival"
              : bulkAction,
          ...(bulkAction === "status" ? { status: bulkStatus } : {}),
          ...(["featured-on", "featured-off", "arrival-on", "arrival-off"].includes(bulkAction)
            ? { enabled: bulkAction.endsWith("-on") }
            : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Bulk action failed.");
      setFeedback(
        bulkAction === "delete"
          ? "Selected products deleted successfully."
          : bulkAction === "status"
            ? `Selected products updated to ${bulkStatus}.`
            : bulkAction.startsWith("featured")
              ? `Featured status ${bulkAction.endsWith("-on") ? "enabled" : "disabled"} for selected products.`
              : `New Arrival status ${bulkAction.endsWith("-on") ? "enabled" : "disabled"} for selected products.`
      );
      setReload((current) => current + 1);
    } catch (bulkError) {
      console.error("Product bulk action failed:", bulkError);
      setError(bulkError instanceof Error ? bulkError.message : "Bulk action failed.");
    } finally {
      setBusy(false);
    }
  }

  function changeSort(nextSort: string) {
    if (sort === nextSort) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSort(nextSort);
      setDirection(nextSort === "name" || nextSort === "sku" ? "asc" : "desc");
    }
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setStatus("");
    setCategoryFilter("");
    setCollectionFilter("");
    setMinimumPrice("");
    setMaximumPrice("");
    setSizeFilter("");
    setColorFilter("");
    setBrandFilter("");
    setFabricFilter("");
    setProductTypeFilter("");
    setFeaturedFilter(false);
    setNewArrivalFilter(false);
    setSaleFilter(false);
    setAvailableFilter(false);
    setSort("createdAt");
    setDirection("desc");
    setPage(1);
  }

  const totalInScope = counts.active + counts.draft + counts.inactive;
  const activeAdvancedFilterCount = [
    Boolean(minimumPrice || maximumPrice),
    Boolean(sizeFilter),
    Boolean(colorFilter),
    Boolean(brandFilter),
    Boolean(fabricFilter),
    Boolean(productTypeFilter),
    featuredFilter,
    newArrivalFilter,
    saleFilter,
    availableFilter,
  ].filter(Boolean).length;
  const attributeFilters: Array<{
    label: string;
    selected: string;
    onChange: (value: string) => void;
    values: string[];
  }> = [
    { label: "Brand", selected: brandFilter, onChange: setBrandFilter, values: availableBrands },
    { label: "Fabric / material", selected: fabricFilter, onChange: setFabricFilter, values: availableFabrics },
    { label: "Product type", selected: productTypeFilter, onChange: setProductTypeFilter, values: availableProductTypes },
  ];

  return (
    <section className="overflow-hidden rounded-xl border border-[#e9e5df] bg-white shadow-sm">
      <div className="grid grid-cols-2 gap-2 border-b border-[#eeeae4] bg-[#fbfaf8] p-3 sm:grid-cols-4 sm:gap-3 sm:p-4">
        {([
          ["Total Products", totalInScope, ""],
          ["Active", counts.active, "active"],
          ["Draft", counts.draft, "draft"],
          ["Inactive", counts.inactive, "inactive"],
        ] as const).map(([label, value, statusValue]) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              setStatus(statusValue);
              setPage(1);
            }}
            className={`flex min-h-[68px] items-center gap-3 rounded-lg border bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-[#b7b2ff] ${
              status === statusValue ? "border-[#7567ff] ring-1 ring-[#7567ff]/20" : "border-slate-100"
            }`}
          >
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                label === "Active"
                  ? "bg-emerald-50 text-emerald-600"
                  : label === "Draft"
                    ? "bg-amber-50 text-amber-600"
                    : label === "Inactive"
                      ? "bg-rose-50 text-rose-600"
                      : "bg-violet-50 text-violet-600"
              }`}
            >
              {label === "Total Products" ? <Package size={16} /> : value}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[10px] font-medium text-slate-500">
                {sectionName === "All" ? label : label === "Total Products" ? `Total ${sectionName} Products` : label}
              </span>
              <span className="block text-lg font-bold leading-5 text-slate-800">{value}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3 border-b border-[#eeeae4] px-4 py-4 sm:px-5">
        <div>
          <h2 className="text-base font-bold text-[#24211e]">
            {newArrivalOnly ? "New Arrival Products" : "Products"}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {total} products match the current filters · category totals are shown above
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search products or SKU"
            aria-label="Search products"
            className="min-h-10 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#2867b2]"
          />
          <select
            value={collectionFilter}
            onChange={(event) => {
              setCollectionFilter(event.target.value);
              setPage(1);
            }}
            aria-label="Filter by collection"
            className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs"
          >
            <option value="">All collections</option>
            {collections.map((collection) => (
              <option key={collection._id} value={collection._id}>{collection.title}</option>
            ))}
          </select>
          {!categoryId && !categoryIds?.length && (
            <select
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by category"
              className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
          )}
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            aria-label="Filter by status"
            className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={`${sort}:${direction}`}
            onChange={(event) => {
              const [field, sortDirection] = event.target.value.split(":");
              setSort(field);
              setDirection(sortDirection as "asc" | "desc");
              setPage(1);
            }}
            aria-label="Sort products"
            className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs"
          >
            <option value="createdAt:desc">Newest first</option>
            <option value="createdAt:asc">Oldest first</option>
            <option value="name:asc">Name A-Z</option>
            <option value="price:asc">Price low-high</option>
            <option value="price:desc">Price high-low</option>
            <option value="stock:asc">Stock low-high</option>
            <option value="stock:desc">Stock high-low</option>
            <option value="sku:asc">SKU A-Z</option>
          </select>
          <button
            type="button"
            onClick={clearFilters}
            className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Clear filters
          </button>
        </div>
        <details className="rounded-lg border border-slate-200 bg-white">
          <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 px-3 text-xs font-semibold text-slate-700">
            <SlidersHorizontal size={14} className="text-violet-600" aria-hidden="true" />
            Filters
            {activeAdvancedFilterCount > 0 && (
              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] text-violet-700">
                {activeAdvancedFilterCount} active
              </span>
            )}
          </summary>
          <div className="grid gap-4 border-t border-slate-100 p-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-[10px] font-semibold text-slate-600">Price range</p>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  aria-label="Minimum price"
                  value={minimumPrice}
                  onChange={(event) => {
                    setMinimumPrice(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Min price"
                  className="min-h-9 min-w-0 rounded-md border border-slate-200 px-2 text-xs"
                />
                <input
                  type="number"
                  min="0"
                  aria-label="Maximum price"
                  value={maximumPrice}
                  onChange={(event) => {
                    setMaximumPrice(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Max price"
                  className="min-h-9 min-w-0 rounded-md border border-slate-200 px-2 text-xs"
                />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-600">Sizes</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {availableSizes.length ? availableSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={sizeFilter === size}
                    onClick={() => {
                      setSizeFilter((current) => current === size ? "" : size);
                      setPage(1);
                    }}
                    className={`min-w-8 rounded border px-2 py-1 text-[10px] font-medium transition ${
                      sizeFilter === size
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-slate-200 text-slate-600 hover:border-violet-300"
                    }`}
                  >
                    {size}
                  </button>
                )) : <span className="text-[10px] text-slate-400">No sizes available</span>}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-600">Colors</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {availableColors.length ? availableColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    aria-label={`Filter color: ${color}`}
                    aria-pressed={colorFilter === color}
                    onClick={() => {
                      setColorFilter((current) => current === color ? "" : color);
                      setPage(1);
                    }}
                    className={`flex size-6 items-center justify-center rounded-full border transition ${
                      colorFilter === color
                        ? "border-violet-600 ring-2 ring-violet-200 ring-offset-1"
                        : "border-slate-200 hover:scale-110"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="size-4 rounded-full border border-black/10"
                      style={{ backgroundColor: getColorSwatch(color) }}
                    />
                  </button>
                )) : <span className="text-[10px] text-slate-400">No colors available</span>}
                {colorFilter && (
                  <span className="text-[10px] text-slate-500">{colorFilter}</span>
                )}
              </div>
            </div>
            {attributeFilters.map(({ label, selected, onChange, values }) => (
              <label key={label} className="text-[10px] font-semibold text-slate-600">
                {label}
                <select
                  value={selected}
                  onChange={(event) => {
                    onChange(event.target.value);
                    setPage(1);
                  }}
                  className="mt-1 min-h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-[10px]"
                >
                  <option value="">Any</option>
                  {values.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
            ))}
            <div className="grid content-start gap-2">
              <label className="flex items-center gap-2 rounded-md border border-slate-200 px-2.5 py-2 text-[10px] text-slate-700">
                <input
                  type="checkbox"
                  checked={saleFilter}
                  onChange={(event) => {
                    setSaleFilter(event.target.checked);
                    setPage(1);
                  }}
                />
                Sale items only
              </label>
              <label className="flex items-center gap-2 rounded-md border border-slate-200 px-2.5 py-2 text-[10px] text-slate-700">
                <input
                  type="checkbox"
                  checked={availableFilter}
                  onChange={(event) => {
                    setAvailableFilter(event.target.checked);
                    setPage(1);
                  }}
                />
                In stock only
              </label>
              <label className="flex items-center gap-2 rounded-md border border-slate-200 px-2.5 py-2 text-[10px] text-slate-700">
                <input
                  type="checkbox"
                  checked={featuredFilter}
                  onChange={(event) => {
                    setFeaturedFilter(event.target.checked);
                    setPage(1);
                  }}
                />
                Featured only
              </label>
              {!newArrivalOnly && (
                <label className="flex items-center gap-2 rounded-md border border-slate-200 px-2.5 py-2 text-[10px] text-slate-700">
                  <input
                    type="checkbox"
                    checked={newArrivalFilter}
                    onChange={(event) => {
                      setNewArrivalFilter(event.target.checked);
                      setPage(1);
                    }}
                  />
                  New arrivals only
                </label>
              )}
            </div>
          </div>
        </details>
      </div>

      {error && (
        <p role="alert" className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {feedback && (
        <p role="status" className="border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {feedback}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className={`${showCategoryColumn ? "min-w-[1120px]" : "min-w-[980px]"} w-full text-left`}>
          <thead className="bg-[#faf9f7]">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Select all products on this page"
                  checked={visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id))}
                  onChange={(event) => setSelectedIds(event.target.checked ? visibleIds : [])}
                />
              </th>
              {[
                ["Product", "name"],
                ["SKU", "sku"],
                ...(showCategoryColumn ? [["Category", ""]] : []),
                ["Collection", ""],
                ["Regular price", "price"],
                ["Discount price", ""],
                ["Stock", "stock"],
                ["Status", ""],
                ["Actions", ""],
              ].map(([label, key]) => (
                <th key={label} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {key ? (
                    <button type="button" onClick={() => changeSort(key)} className="hover:text-slate-900">
                      {label}{sort === key ? (direction === "asc" ? " ↑" : " ↓") : ""}
                    </button>
                  ) : label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0ede8]">
            {loading ? (
              Array.from({ length: 5 }, (_, row) => (
                <tr key={`product-skeleton-${row}`} className="animate-pulse">
                {Array.from({ length: tableColumnCount }, (_, column) => (
                    <td key={`skeleton-cell-${column}`} className="px-4 py-4">
                      <span className={`block h-3 rounded bg-slate-100 ${column === 1 ? "h-12 w-36" : "w-16"}`} />
                    </td>
                  ))}
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr><td colSpan={tableColumnCount} className="px-4 py-12 text-center text-sm text-slate-500">No products match these filters.</td></tr>
            ) : products.map((product) => {
              const productFields = getCanonicalProductFields(product);
              const publicationStatus = getStatus(product);
              const categoryName = typeof product.category === "object" ? product.category?.name : "";
              const collectionName = product.collections?.length
                ? product.collections.map((item) => typeof item === "object" ? item.title : "").filter(Boolean).join(", ")
                : typeof product.collection === "object" ? product.collection?.title : "";
              return (
                <tr key={product._id} className="transition-colors hover:bg-[#fcfbf9]">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${product.name}`}
                      checked={selectedIds.includes(product._id)}
                      onChange={(event) => setSelectedIds((current) =>
                        event.target.checked
                          ? [...current, product._id]
                          : current.filter((id) => id !== product._id)
                      )}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.images?.[0] ? (
                        <Image src={product.images[0]} alt={product.name} width={48} height={56} unoptimized className="h-14 w-12 rounded-md border border-slate-100 object-cover" />
                      ) : (
                        <div className="flex h-14 w-12 items-center justify-center rounded-md bg-slate-100 text-slate-400"><Package size={17} /></div>
                      )}
                      <div className="min-w-0">
                        <p className="max-w-52 truncate text-xs font-semibold text-[#292521]">{product.name}</p>
                        <div className="mt-1 flex gap-1">
                          {productFields.featured && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] text-amber-700"><Star size={10} className="mr-0.5 inline" />Featured</span>}
                          {productFields.newArrival && <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] text-emerald-700">New Arrival</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{product.sku || "—"}</td>
                  {showCategoryColumn && (
                    <td className="px-4 py-3 text-xs text-slate-600">{categoryName || "—"}</td>
                  )}
                  <td className="px-4 py-3 text-xs text-slate-600">{collectionName || "—"}</td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-800">Rs. {product.price.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {product.discountPrice && product.discountPrice > 0
                      ? `Rs. ${product.discountPrice.toLocaleString()}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#f3f1ed] px-2.5 py-1 text-[11px] font-medium text-slate-700">
                      <Package size={12} />{product.stock ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${statusClass(publicationStatus)}`}>
                      {publicationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {product.slug && (
                        <Link href={`/product/${product.slug}`} target="_blank" aria-label={`View ${product.name}`} className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
                          <ExternalLink size={14} />
                        </Link>
                      )}
                      <button type="button" onClick={() => onEdit(product)} aria-label={`Edit ${product.name}`} className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
                        <Pencil size={14} />
                      </button>
                      <button type="button" onClick={() => void deleteProduct(product._id)} disabled={busy} aria-label={`Delete ${product.name}`} className="rounded-md border border-slate-200 p-2 text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-[#eeeae4] px-4 py-3 text-xs text-slate-600">
        <span>Page {page} of {totalPages} · {total} products</span>
        <div className="flex gap-2">
          <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} className="inline-flex min-h-9 items-center gap-1 rounded-md border border-slate-200 px-3 disabled:opacity-50">
            <ChevronLeft size={14} />Previous
          </button>
          <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)} className="inline-flex min-h-9 items-center gap-1 rounded-md border border-slate-200 px-3 disabled:opacity-50">
            Next<ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div className="grid gap-3 border-t border-[#eeeae4] bg-[#fbfaf8] p-3 sm:p-4">
        <section className="min-w-0 rounded-lg border border-slate-100 bg-white p-3">
          <h3 className="text-xs font-bold text-slate-800">Bulk Actions</h3>
          <p className="mt-1 text-[10px] text-slate-500">
            {selectedIds.length ? `${selectedIds.length} product${selectedIds.length === 1 ? "" : "s"} selected on this page` : "Select products in the table to manage them together."}
          </p>
          <label className="mt-3 flex items-center gap-2 text-[10px] text-slate-600">
            <input
              type="checkbox"
              checked={visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id))}
              onChange={(event) => setSelectedIds(event.target.checked ? visibleIds : [])}
            />
            Select all on this page ({visibleIds.length})
          </label>
          <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="grid min-w-0 grid-cols-2 gap-2">
              <select
                value={bulkAction}
                onChange={(event) => setBulkAction(event.target.value as typeof bulkAction)}
                aria-label="Choose bulk action"
                className="min-h-9 min-w-0 rounded-md border border-slate-200 bg-white px-2 text-[10px]"
              >
                <option value="status">Change status</option>
                <option value="featured-on">Mark featured</option>
                <option value="featured-off">Unmark featured</option>
                <option value="arrival-on">Mark new arrival</option>
                <option value="arrival-off">Unmark new arrival</option>
                <option value="delete">Delete selected</option>
              </select>
              {bulkAction === "status" ? (
                <select
                  value={bulkStatus}
                  onChange={(event) => setBulkStatus(event.target.value as ProductStatus)}
                  aria-label="Set selected product status"
                  className="min-h-9 min-w-0 rounded-md border border-slate-200 bg-white px-2 text-[10px]"
                >
                  <option value="active">Set Active</option>
                  <option value="draft">Set Draft</option>
                  <option value="inactive">Set Inactive</option>
                </select>
              ) : (
                <span className="flex min-h-9 items-center rounded-md bg-slate-50 px-2 text-[10px] text-slate-500">
                  {bulkAction === "delete" ? "Requires confirmation" : "Applies to selection"}
                </span>
              )}
            </div>
            <button
              type="button"
              disabled={!selectedIds.length || busy}
              onClick={() => void runBulkAction()}
              className="min-h-9 rounded-md bg-violet-600 px-4 text-[10px] font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Working..." : "Apply"}
            </button>
          </div>
          <p className="mt-3 rounded-md bg-violet-50 px-2.5 py-2 text-[10px] leading-relaxed text-violet-800">
            Select products above to update status, featured or new-arrival flags, or delete after confirmation.
          </p>
        </section>
      </div>
    </section>
  );
}
