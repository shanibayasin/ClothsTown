"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";

interface CollectionProduct {
  _id: string;
  name: string;
  slug: string;
  images?: string[];
  price: number;
  discountPrice?: number;
  stock?: number;
  category?: { name?: string } | string;
}

export default function CollectionProductManager({
  collectionId,
}: {
  collectionId: string;
}) {
  const [products, setProducts] = useState<CollectionProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      setLoading(true);
      setError("");
      try {
        const [productsResponse, assignmentsResponse] = await Promise.all([
          adminFetch("/api/products?admin=true&page=1&pageSize=100", {
            cache: "no-store",
          }),
          adminFetch(`/api/collections/${collectionId}/products`, {
            cache: "no-store",
          }),
        ]);
        if (!productsResponse.ok || !assignmentsResponse.ok) {
          throw new Error("Could not load products for this collection.");
        }

        const [firstProductPage, assignmentData] = await Promise.all([
          productsResponse.json(),
          assignmentsResponse.json(),
        ]);
        if (
          !Array.isArray(firstProductPage.products) ||
          typeof firstProductPage.totalPages !== "number" ||
          !Array.isArray(assignmentData.productIds)
        ) {
          throw new Error("The collection products response is invalid.");
        }
        const additionalPages = await Promise.all(
          Array.from({ length: firstProductPage.totalPages - 1 }, async (_, index) => {
            const response = await adminFetch(
              `/api/products?admin=true&page=${index + 2}&pageSize=100`,
              { cache: "no-store" }
            );
            const pageData = await response.json();
            if (!response.ok || !Array.isArray(pageData.products)) {
              throw new Error("Could not load all collection products.");
            }
            return pageData.products as CollectionProduct[];
          })
        );
        const loadedProducts = [...firstProductPage.products, ...additionalPages.flat()];
        if (!active) return;

        setProducts(
          loadedProducts.filter(
            (product: CollectionProduct) =>
              product && typeof product._id === "string" && typeof product.name === "string"
          )
        );
        setSelectedIds(
          assignmentData.productIds.filter(
            (id: unknown): id is string => typeof id === "string"
          )
        );
      } catch (loadError) {
        console.error("Failed to load collection products:", loadError);
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load products for this collection."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProducts();
    return () => {
      active = false;
    };
  }, [collectionId]);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter(
      (product) =>
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.slug.toLowerCase().includes(query)
    );
  }, [products, search]);

  async function saveAssignments() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const response = await adminFetch(`/api/collections/${collectionId}/products`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: selectedIds }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Could not save collection products.");
      }
      setSelectedIds(data.productIds);
      setSaved(true);
    } catch (saveError) {
      console.error("Failed to save collection products:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save collection products."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 bg-slate-50/50 p-5 sm:flex-row sm:items-center sm:p-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Products in this collection</h2>
          <p className="mt-1 text-xs text-slate-500">
            Select existing products. Their product details stay shared across every collection.
          </p>
        </div>
        <label className="relative block w-full sm:max-w-64">
          <span className="sr-only">Search existing products</span>
          <Search
            size={16}
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#6f1d46]"
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="mx-5 mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="mx-5 mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Collection products saved.
        </p>
      )}

      <div className="max-h-[520px] overflow-y-auto p-4 sm:p-5">
        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">Loading products...</p>
        ) : visibleProducts.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">No products found.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {visibleProducts.map((product) => {
              const selected = selectedIds.includes(product._id);
              const price =
                product.discountPrice &&
                product.discountPrice > 0 &&
                product.discountPrice < product.price
                  ? product.discountPrice
                  : product.price;
              return (
                <label
                  key={product._id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 transition ${
                    selected
                      ? "border-[#6f1d46]/40 bg-[#fff8fa]"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() =>
                      setSelectedIds((current) =>
                        selected
                          ? current.filter((id) => id !== product._id)
                          : [...current, product._id]
                      )
                    }
                    className="size-4 shrink-0 accent-[#6f1d46]"
                  />
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    <Image
                      src={product.images?.[0] || "/images/placeholder-product.jpg"}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">
                      {product.name}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Rs. {price.toLocaleString()} · Stock {product.stock ?? 0}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
        <p className="text-xs text-slate-500">{selectedIds.length} products selected</p>
        <button
          type="button"
          onClick={() => void saveAssignments()}
          disabled={loading || saving}
          className="min-h-10 rounded-lg bg-[#6f1d46] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5d163a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save products"}
        </button>
      </div>
    </section>
  );
}
