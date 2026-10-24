"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ProductFilterDrawer, {
  type ProductFilterKey,
  type ProductFilterOption,
  type ProductFilterValues,
} from "@/app/components/shop/ProductFilterDrawer";

const QUERY_KEYS: Record<ProductFilterKey, string> = {
  category: "subcategory",
  collection: "collection",
  gender: "gender",
  size: "size",
  color: "color",
  brand: "brand",
  productType: "productType",
  fabric: "fabric",
  season: "season",
};

export default function UrlProductFilters({
  options,
  value,
  priceCeiling,
  showGender = false,
  showCategory = false,
  showCollection = false,
}: {
  options: Partial<Record<ProductFilterKey, ProductFilterOption[]>>;
  value: ProductFilterValues;
  priceCeiling: number;
  showGender?: boolean;
  showCategory?: boolean;
  showCollection?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function applyFilters(filters: ProductFilterValues) {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of [...Object.values(QUERY_KEYS), "minPrice", "maxPrice", "available", "sale", "page"]) {
      params.delete(key);
    }
    for (const key of Object.keys(QUERY_KEYS) as ProductFilterKey[]) {
      for (const option of filters[key]) {
        params.append(QUERY_KEYS[key], option);
      }
    }
    if (filters.minPrice > 0) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice > 0 && filters.maxPrice < priceCeiling) {
      params.set("maxPrice", String(filters.maxPrice));
    }
    if (filters.availability) params.set("available", "true");
    if (filters.onSale) params.set("sale", "true");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <ProductFilterDrawer
      options={options}
      value={value}
      priceCeiling={priceCeiling}
      showGender={showGender}
      showCategory={showCategory}
      showCollection={showCollection}
      onApply={applyFilters}
    />
  );
}
