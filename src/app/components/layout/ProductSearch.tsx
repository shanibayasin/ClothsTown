"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { readJsonResponse } from "@/lib/api";

interface SearchProduct {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  images?: string[];
  price: number;
  discountPrice?: number;
  sku?: string;
  shortDescription?: string;
  description?: string;
  brand?: string;
  productType?: string;
  fabric?: string;
  season?: string;
  category?: { name?: string } | string | null;
}

export default function ProductSearch({
  id,
  compact = false,
  accountPage = false,
}: {
  id: string;
  compact?: boolean;
  accountPage?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLFormElement>(null);
  const listId = `${id}-suggestions`;

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      setSearchError("");

      try {
        const response = await fetch(
          `/api/products?search=${encodeURIComponent(term)}&limit=6`,
          { cache: "no-store", signal: controller.signal }
        );
        if (!response.ok) {
          throw new Error(`Search request failed (${response.status}).`);
        }
        const products = await readJsonResponse<SearchProduct[]>(response, []);
        setResults(products);
        setActiveIndex(-1);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Product search failed:", error);
        setResults([]);
        setSearchError("Search is temporarily unavailable. Please try again.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!query.trim()) {
      event.preventDefault();
      setIsOpen(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!results.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) =>
        current <= 0 ? results.length - 1 : current - 1
      );
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      window.location.assign(`/product/${results[activeIndex].slug}`);
    }
  }

  const inputClass = compact
    ? "h-9 min-w-0 flex-1 rounded-l-full border border-r-0 border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-[#6f1d46] focus:bg-white"
    : `min-w-0 flex-1 border border-r-0 border-[#d9e0e5] bg-[#f7f8fa] text-[#243643] outline-none transition focus:border-[#9eabb3] focus:bg-white ${
        accountPage
          ? "h-9 rounded-l-[9px] px-3 text-[10px] lg:h-[34px]"
          : "h-10 rounded-l-[18px] px-4 text-sm lg:h-14 lg:rounded-l-[20px] lg:px-5"
      }`;
  const buttonClass = compact
    ? "flex h-9 w-10 items-center justify-center rounded-r-full bg-[#14242b] text-white hover:bg-[#6f1d46]"
    : `flex items-center justify-center bg-[#102633] text-white transition hover:bg-[#6f1d46] ${
        accountPage
          ? "h-9 w-10 rounded-r-[9px] lg:h-[34px]"
          : "h-10 w-12 rounded-r-[18px] lg:h-14 lg:w-[68px] lg:rounded-r-[20px]"
      }`;

  return (
    <form
      ref={containerRef}
      action="/shop"
      method="get"
      role="search"
      onSubmit={handleSubmit}
      className={`relative min-w-0 ${
        compact
          ? "flex w-full border-t border-gray-100 px-4 py-2 md:hidden"
          : "hidden max-w-[660px] flex-1 md:flex"
      }`}
    >
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <input
        id={id}
        type="search"
        name="search"
        value={query}
        autoComplete="off"
        placeholder={
          compact
            ? "Search products..."
            : "Search for jackets, hoodies, sweaters, and more..."
        }
        aria-label="Search products"
        role="combobox"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-expanded={isOpen && query.trim().length >= 2}
        aria-activedescendant={
          activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
        }
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setResults([]);
          setIsOpen(true);
          setIsLoading(false);
          setSearchError("");
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        className={inputClass}
      />
      <button type="submit" aria-label="Search products" className={buttonClass}>
        <Search size={compact ? 16 : 21} aria-hidden="true" />
      </button>

      {isOpen && query.trim().length >= 2 && (
        <div
          id={listId}
          role="listbox"
          aria-label="Product search suggestions"
          className="absolute left-0 right-0 top-full z-[120] overflow-hidden rounded-b-xl border border-t-0 border-[#eadde2] bg-white shadow-xl"
        >
          {isLoading ? (
            <p className="px-4 py-3 text-xs text-[#806d75]" role="status">
              Searching products...
            </p>
          ) : searchError ? (
            <p className="px-4 py-3 text-xs text-red-700" role="alert">
              {searchError}
            </p>
          ) : results.length > 0 ? (
            <>
              {results.map((product, index) => {
                const image =
                  product.images?.find(Boolean) ||
                  product.image ||
                  "/placeholder-product.svg";
                const category =
                  typeof product.category === "object" && product.category
                    ? product.category.name
                    : product.category;
                const price =
                  product.discountPrice && product.discountPrice > 0
                    ? product.discountPrice
                    : product.price;

                return (
                  <Link
                    key={product._id}
                    id={`${listId}-option-${index}`}
                    role="option"
                    aria-selected={activeIndex === index}
                    href={`/product/${product.slug}`}
                    onClick={() => setIsOpen(false)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`flex items-center gap-3 px-3 py-2.5 transition ${
                      activeIndex === index ? "bg-[#faf4f6]" : "hover:bg-[#faf4f6]"
                    }`}
                  >
                    <span className="relative size-12 shrink-0 overflow-hidden rounded bg-[#f8f1f2]">
                      <Image
                        src={image}
                        alt=""
                        fill
                        unoptimized
                        sizes="48px"
                        className="object-cover"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-[#30232a]">
                        {product.name}
                      </span>
                      {category && (
                        <span className="mt-0.5 block truncate text-[10px] text-[#8b777e]">
                          {category}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-[#6f1d46]">
                      Rs. {price.toLocaleString()}
                    </span>
                  </Link>
                );
              })}
              <Link
                href={`/shop?search=${encodeURIComponent(query.trim())}`}
                onClick={() => setIsOpen(false)}
                className="block border-t border-[#eee4e8] px-4 py-3 text-center text-xs font-semibold text-[#6f1d46] hover:bg-[#faf4f6]"
              >
                View all results for &ldquo;{query.trim()}&rdquo;
              </Link>
            </>
          ) : (
            <div className="px-4 py-3 text-xs text-[#806d75]">
              No products found for &ldquo;{query.trim()}&rdquo;.
            </div>
          )}
        </div>
      )}
    </form>
  );
}
