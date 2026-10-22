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
  Star,
  Trash2,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";

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
}

const PAGE_SIZE = 20;

function getStatus(product: AdminProduct): ProductStatus {
  return (
    product.publicationStatus ??
    (product.status === false ? "inactive" : "active")
  );
}

function statusClass(status: ProductStatus) {
  if (status === "active") return "bg-emerald-50 text-emerald-700";
  if (status === "draft") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

export default function ProductTable({
  refresh,
  onEdit,
  categoryId,
  categoryIds,
  newArrivalOnly = false,
}: Props) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Array<{ _id: string; name: string }>>([]);
  const [counts, setCounts] = useState<Record<ProductStatus, number>>({
    active: 0,
    draft: 0,
    inactive: 0,
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<ProductStatus>("active");
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (categoryId || categoryIds?.length) return;
    let active = true;
    void fetch("/api/categories", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load product categories.");
        return response.json();
      })
      .then((data: unknown) => {
        if (active && Array.isArray(data)) {
          setCategories(
            data.filter(
              (item): item is { _id: string; name: string } =>
                typeof item?._id === "string" && typeof item?.name === "string"
            )
          );
        }
      })
      .catch((loadError: unknown) => {
        console.error("Failed to load product categories:", loadError);
      });
    return () => {
      active = false;
    };
  }, [categoryId, categoryIds]);

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
    if (newArrivalOnly) query.set("newArrival", "true");
    if (categoryId) query.set("categoryId", categoryId);
    else if (categoryIds?.length) query.set("categoryId", categoryIds.join(","));
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
        setCounts(data.counts ?? { active: 0, draft: 0, inactive: 0 });
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
  }, [refresh, reload, page, search, status, sort, direction, newArrivalOnly, categoryId, categoryIds, categoryFilter]);

  const visibleIds = useMemo(() => products.map((product) => product._id), [products]);

  async function deleteProduct(id: string) {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    setBusy(true);
    setError("");
    try {
      const response = await adminFetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete product.");
      setReload((current) => current + 1);
    } catch (deleteError) {
      console.error("Failed to delete product:", deleteError);
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete product.");
    } finally {
      setBusy(false);
    }
  }

  async function runBulkAction(action: "status" | "delete") {
    if (selectedIds.length === 0) return;
    if (
      action === "delete" &&
      !window.confirm(`Delete ${selectedIds.length} selected products? This cannot be undone.`)
    ) {
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await adminFetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          action,
          ...(action === "status" ? { status: bulkStatus } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Bulk action failed.");
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

  return (
    <section className="overflow-hidden rounded-xl border border-[#e9e5df] bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-[#eeeae4] px-4 py-4 sm:flex-row sm:items-center sm:px-5">
        <div>
          <h2 className="text-base font-bold text-[#24211e]">
            {newArrivalOnly ? "New Arrival Products" : "Products"}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {total} products · {counts.active} active · {counts.draft} draft · {counts.inactive} inactive
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
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
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-[#eeeae4] bg-[#faf9f7] px-4 py-3">
        <span className="text-xs text-slate-600">{selectedIds.length} selected</span>
        <select
          value={bulkStatus}
          onChange={(event) => setBulkStatus(event.target.value as ProductStatus)}
          aria-label="Set selected product status"
          className="min-h-9 rounded-md border border-slate-200 bg-white px-2 text-xs"
        >
          <option value="active">Set Active</option>
          <option value="draft">Set Draft</option>
          <option value="inactive">Set Inactive</option>
        </select>
        <button
          type="button"
          disabled={!selectedIds.length || busy}
          onClick={() => void runBulkAction("status")}
          className="min-h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold disabled:opacity-50"
        >
          Apply status
        </button>
        <button
          type="button"
          disabled={!selectedIds.length || busy}
          onClick={() => void runBulkAction("delete")}
          className="min-h-9 rounded-md border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 disabled:opacity-50"
        >
          Delete selected
        </button>
        <select
          value={`${sort}:${direction}`}
          onChange={(event) => {
            const [field] = event.target.value.split(":");
            changeSort(field);
          }}
          aria-label="Sort products"
          className="ml-auto min-h-9 rounded-md border border-slate-200 bg-white px-2 text-xs"
        >
          <option value="createdAt:desc">Newest first</option>
          <option value="name:asc">Name A-Z</option>
          <option value="price:asc">Price low-high</option>
          <option value="price:desc">Price high-low</option>
          <option value="stock:asc">Stock low-high</option>
          <option value="stock:desc">Stock high-low</option>
          <option value="sku:asc">SKU A-Z</option>
        </select>
      </div>

      {error && (
        <p role="alert" className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-[1020px] w-full text-left">
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
                ["Category", ""],
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
              <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-500">Loading products…</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-500">No products match these filters.</td></tr>
            ) : products.map((product) => {
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
                        <p className="mt-1 text-[10px] text-slate-500">{collectionName || "No collection"}</p>
                        <div className="mt-1 flex gap-1">
                          {(product.featured || product.isFeatured) && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] text-amber-700"><Star size={10} className="mr-0.5 inline" />Featured</span>}
                          {(product.newArrival || product.isNewArrival) && <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] text-emerald-700">New Arrival</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{product.sku || "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{categoryName || "—"}</td>
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
    </section>
  );
}
