"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { CATEGORY_CATALOG } from "@/lib/category-catalog";

export type ProductFilterKey =
  | "category"
  | "collection"
  | "gender"
  | "size"
  | "color"
  | "brand"
  | "productType"
  | "fabric"
  | "season";

export interface ProductFilterOption {
  value: string;
  label: string;
  swatch?: string;
}

export interface ProductFilterValues {
  category: string[];
  collection: string[];
  gender: string[];
  size: string[];
  color: string[];
  brand: string[];
  productType: string[];
  fabric: string[];
  season: string[];
  minPrice: number;
  maxPrice: number;
  availability: boolean;
  onSale: boolean;
}

export const EMPTY_PRODUCT_FILTERS: ProductFilterValues = {
  category: [],
  collection: [],
  gender: [],
  size: [],
  color: [],
  brand: [],
  productType: [],
  fabric: [],
  season: [],
  minPrice: 0,
  maxPrice: 0,
  availability: false,
  onSale: false,
};

const FILTER_GROUPS: Array<{ key: ProductFilterKey; title: string }> = [
  { key: "category", title: "Category" },
  { key: "collection", title: "Collection" },
  { key: "gender", title: "Gender" },
  { key: "size", title: "Size" },
  { key: "color", title: "Color" },
  { key: "brand", title: "Brand" },
  { key: "productType", title: "Product Type" },
  { key: "fabric", title: "Fabric" },
  { key: "season", title: "Season" },
];

function colorValue(value: string, swatch?: string) {
  if (swatch) return swatch;
  if (/^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(value)) return value;
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
  return namedColors[value.trim().toLowerCase()] ?? "#94a3b8";
}

function normalizeFilters(
  filters: Partial<ProductFilterValues> | null | undefined
): ProductFilterValues {
  return {
    category: Array.isArray(filters?.category) ? filters.category : [],
    collection: Array.isArray(filters?.collection) ? filters.collection : [],
    gender: Array.isArray(filters?.gender) ? filters.gender : [],
    size: Array.isArray(filters?.size) ? filters.size : [],
    color: Array.isArray(filters?.color) ? filters.color : [],
    brand: Array.isArray(filters?.brand) ? filters.brand : [],
    productType: Array.isArray(filters?.productType) ? filters.productType : [],
    fabric: Array.isArray(filters?.fabric) ? filters.fabric : [],
    season: Array.isArray(filters?.season) ? filters.season : [],
    minPrice:
      typeof filters?.minPrice === "number" && Number.isFinite(filters.minPrice)
        ? filters.minPrice
        : 0,
    maxPrice:
      typeof filters?.maxPrice === "number" && Number.isFinite(filters.maxPrice)
        ? filters.maxPrice
        : 0,
    availability: filters?.availability === true,
    onSale: filters?.onSale === true,
  };
}

function countSelected(filters: ProductFilterValues, priceCeiling: number) {
  return (
    FILTER_GROUPS.reduce((count, group) => count + filters[group.key].length, 0) +
    Number(
      filters.minPrice > 0 ||
        (filters.maxPrice > 0 && filters.maxPrice < priceCeiling)
    ) +
    Number(filters.availability) +
    Number(filters.onSale)
  );
}

export default function ProductFilterDrawer({
  options,
  value,
  priceCeiling,
  onApply,
  showGender = false,
  showCategory = false,
  showCollection = false,
  singleSelectKeys = [],
}: {
  options: Partial<Record<ProductFilterKey, ProductFilterOption[]>>;
  value: ProductFilterValues;
  priceCeiling: number;
  onApply: (filters: ProductFilterValues) => void;
  showGender?: boolean;
  showCategory?: boolean;
  showCollection?: boolean;
  singleSelectKeys?: ProductFilterKey[];
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => normalizeFilters(value));
  const normalizedValue = normalizeFilters(value);
  const maximum = Math.max(1, priceCeiling);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function toggleOption(key: ProductFilterKey, option: string) {
    setDraft((current) => ({
      ...current,
      [key]: singleSelectKeys.includes(key)
        ? current[key].includes(option)
          ? []
          : [option]
        : current[key].includes(option)
          ? current[key].filter((item) => item !== option)
          : [...current[key], option],
    }));
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setDraft(normalizedValue);
          setOpen(true);
        }}
        aria-expanded={open}
        aria-controls="product-filter-drawer"
        className="inline-flex min-h-9 items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--brand-primary)] hover:text-[var(--text-secondary)]"
      >
        <SlidersHorizontal size={15} aria-hidden="true" />
        Filter
        {countSelected(normalizedValue, maximum) > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-[var(--brand-primary)] text-[10px] text-white">
            {countSelected(normalizedValue, maximum)}
          </span>
        )}
      </button>
      <div
        className={`fixed inset-0 z-[1000] transition-[visibility] duration-300 ${
          open ? "visible" : "invisible pointer-events-none"
        }`}
      >
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
            tabIndex={open ? 0 : -1}
            className={`absolute inset-0 bg-black/35 transition-opacity duration-300 ${
              open ? "opacity-100" : "opacity-0"
            }`}
          />
          <section
            id="product-filter-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-filter-title"
            aria-hidden={!open}
            className={`absolute inset-y-0 right-0 flex h-full w-full max-w-[460px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
              open ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <header className="relative flex h-14 shrink-0 items-center justify-center border-b border-[var(--border-color)]">
              <h2 id="product-filter-title" className="text-sm font-semibold text-[var(--brand-primary)]">
                Filter
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close filters"
                className="absolute right-4 flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition hover:bg-[var(--section-background)]"
              >
                <X size={20} strokeWidth={1.6} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 sm:px-7">
              {FILTER_GROUPS.filter(({ key }) =>
                key === "category"
                  ? showCategory
                  : key === "collection"
                    ? showCollection
                  : key === "gender"
                  ? showGender && (options.gender?.length ?? 0) > 0
                    : (options[key]?.length ?? 0) > 0
              ).map(({ key, title }) => (
                <details key={key} className="group border-b border-[var(--border-color)]" open>
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between text-sm font-medium text-[var(--brand-primary)] [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center gap-2">
                      {title}
                      {draft[key].length > 0 && (
                        <span className="text-xs text-[var(--text-secondary)]">({draft[key].length})</span>
                      )}
                    </span>
                    <span className="text-lg font-light text-[var(--text-secondary)] transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <div className="grid gap-3 pb-5 sm:grid-cols-2">
                    {(key === "productType"
                      ? (options[key] ?? []).filter((option) =>
                          option.value.toLowerCase() !== "men" &&
                          !CATEGORY_CATALOG.some(
                            (category) =>
                              category.name.toLowerCase() === option.value.toLowerCase()
                          )
                        )
                      : options[key] ?? []
                    ).map((option) =>
                      key === "color" ? (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleOption(key, option.value)}
                          aria-pressed={draft.color.includes(option.value)}
                          className="flex min-h-9 items-center gap-2 text-left text-xs text-[var(--text-secondary)]"
                        >
                          <span
                            className={`flex size-6 items-center justify-center rounded-full border ${
                              draft.color.includes(option.value)
                                ? "border-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)] ring-offset-2"
                                : "border-[var(--border-color)]"
                            }`}
                          >
                            <span
                              className="size-4 rounded-full border border-black/10"
                              style={{ backgroundColor: colorValue(option.value, option.swatch) }}
                            />
                          </span>
                          {option.label}
                        </button>
                      ) : (
                        <label
                          key={option.value}
                          className="flex cursor-pointer items-center gap-2.5 text-xs text-[var(--text-secondary)]"
                        >
                          <input
                            type="checkbox"
                            checked={draft[key].includes(option.value)}
                            onChange={() => toggleOption(key, option.value)}
                            className="size-4 accent-[var(--brand-primary)]"
                          />
                          {option.label}
                        </label>
                      )
                    )}
                  </div>
                </details>
              ))}

              <details className="group border-b border-[var(--border-color)]" open>
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between text-sm font-medium text-[var(--brand-primary)] [&::-webkit-details-marker]:hidden">
                  Price Range
                  <span className="text-lg font-light text-[var(--text-secondary)] transition-transform group-open:rotate-45">+</span>
                </summary>
                <div className="space-y-4 pb-5">
                  <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                    <span>Rs. {draft.minPrice.toLocaleString()}</span>
                    <span>Rs. {(draft.maxPrice || maximum).toLocaleString()}</span>
                  </div>
                  <label className="block">
                    <span className="sr-only">Minimum price</span>
                    <input
                      type="range"
                      min="0"
                      max={maximum}
                      step={Math.max(1, Math.round(maximum / 100))}
                      value={Math.min(draft.minPrice, draft.maxPrice || maximum)}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          minPrice: Math.min(
                            Number(event.target.value),
                            current.maxPrice || maximum
                          ),
                        }))
                      }
                      className="w-full accent-[var(--brand-primary)]"
                    />
                  </label>
                  <label className="block">
                    <span className="sr-only">Maximum price</span>
                    <input
                      type="range"
                      min="0"
                      max={maximum}
                      step={Math.max(1, Math.round(maximum / 100))}
                      value={draft.maxPrice || maximum}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          maxPrice: Math.max(
                            Number(event.target.value),
                            current.minPrice
                          ),
                        }))
                      }
                      className="w-full accent-[var(--brand-primary)]"
                    />
                  </label>
                </div>
              </details>

              <details className="group border-b border-[var(--border-color)]" open>
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between text-sm font-medium text-[var(--brand-primary)] [&::-webkit-details-marker]:hidden">
                  Availability
                  <span className="text-lg font-light text-[var(--text-secondary)] transition-transform group-open:rotate-45">+</span>
                </summary>
                <label className="flex cursor-pointer items-center gap-2.5 pb-5 text-xs text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={draft.availability}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        availability: event.target.checked,
                      }))
                    }
                    className="size-4 accent-[var(--brand-primary)]"
                  />
                  In stock only
                </label>
              </details>

              <details className="group border-b border-[var(--border-color)]" open>
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between text-sm font-medium text-[var(--brand-primary)] [&::-webkit-details-marker]:hidden">
                  On Sale
                  <span className="text-lg font-light text-[var(--text-secondary)] transition-transform group-open:rotate-45">+</span>
                </summary>
                <label className="flex cursor-pointer items-center gap-2.5 pb-5 text-xs text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={draft.onSale}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        onSale: event.target.checked,
                      }))
                    }
                    className="size-4 accent-[var(--brand-primary)]"
                  />
                  Sale items only
                </label>
              </details>
            </div>

            <footer className="grid shrink-0 grid-cols-2 gap-3 border-t border-[var(--border-color)] bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-7">
              <button
                type="button"
                onClick={() => setDraft(EMPTY_PRODUCT_FILTERS)}
                className="min-h-11 border border-[var(--brand-primary)] text-[11px] font-semibold uppercase tracking-wide text-[var(--brand-primary)] transition hover:bg-[var(--section-background)]"
              >
                Remove All
              </button>
              <button
                type="button"
                onClick={() => {
                  onApply(draft);
                  setOpen(false);
                }}
                className="min-h-11 bg-[var(--brand-primary)] text-[11px] font-semibold uppercase tracking-wide text-white transition hover:bg-[var(--brand-primary-hover)]"
              >
                Apply
              </button>
            </footer>
          </section>
      </div>
    </>
  );
}
