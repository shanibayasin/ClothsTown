"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { readJsonResponse } from "@/lib/api";
import ProductFilterDrawer, {
  EMPTY_PRODUCT_FILTERS,
  type ProductFilterValues,
} from "@/app/components/shop/ProductFilterDrawer";
import ProductCard, {
  type StoreProductCardData,
} from "@/app/components/product/ProductCard";
import HeroBanner from "@/app/components/shop/HeroBanner";
import { CATEGORY_CATALOG, sortProductSizes } from "@/lib/category-catalog";

interface Product {
  _id: string;
  name: string;
  slug: string;
  sku?: string;
  images: string[];
  image?: string;
  price: number;
  discountPrice?: number;
  onSale?: boolean;
  featured: boolean;
  newArrival: boolean;
  category: {
    _id: string;
    name: string;
    routeGroup?: string;
    gender?: string;
  };
  gender?: "men" | "women" | "girls" | "boys" | "unisex";
  collection?: {
    _id: string;
    title: string;
  };
  collections?: {
    _id: string;
    title: string;
  }[];
  sizes?: string[];
  colors?: string[];
  season?: string;
  fabric?: string;
  productType?: string;
  brand?: string;
  shortDescription?: string;
  description?: string;
  stock: number;
}

interface Category {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  bannerImage?: string;
  bannerTitle?: string;
  bannerDescription?: string;
  bannerButtonText?: string;
  bannerButtonLink?: string;
  bannerPosition?: "left" | "center" | "right";
  status?: boolean;
  parentCategory?: string | null;
  routeGroup?: string;
  sortOrder?: number;
  sectionTiles?: {
    title: string;
    image: string;
    category: string;
  }[];
}

interface Collection {
  _id: string;
  title: string;
}

const ITEMS_PER_PAGE = 9;

function getProductImage(product: Product) {
  return product.images?.[0] || product.image || "/placeholder-product.svg";
}

function getProductPrice(product: Product) {
  return product.discountPrice && product.discountPrice > 0
    ? product.discountPrice
    : product.price;
}

function getProductGender(gender: Product["gender"], name: string) {
  if (gender) return gender;
  const value = name.toLowerCase();
  if (/\bmen\b|men's|mens/.test(value)) return "men";
  if (/\bwomen\b|women's|womens|ladies/.test(value)) return "women";
  if (/\bgirls?\b/.test(value)) return "girls";
  if (/\bboys?\b/.test(value)) return "boys";
  return "";
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
  const viewAllQuery = searchParams.get("view") === "all";

  return (
    <ShopContent
      key={`${searchQuery}:${categoryQuery}:${saleQuery}:${viewAllQuery}`}
      searchQuery={searchQuery}
      categoryQuery={categoryQuery}
      saleQuery={saleQuery}
      viewAllQuery={viewAllQuery}
    />
  );
}

function ShopContent({
  searchQuery,
  categoryQuery,
  saleQuery,
  viewAllQuery,
}: {
  searchQuery: string;
  categoryQuery: string;
  saleQuery: string;
  viewAllQuery: boolean;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productLoadError, setProductLoadError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState(categoryQuery.toLowerCase());
  const [sort, setSort] = useState("latest");
  const [selectedCollection, setSelectedCollection] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState(100000);
  const [minimumPrice, setMinimumPrice] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [saleOnly, setSaleOnly] = useState(saleQuery === "true");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filterSection, setFilterSection] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAllProducts() {
      const pageSize = 100;
      const firstResponse = await fetch(
        `/api/products?limit=${pageSize}&offset=0`,
        { cache: "no-store" }
      );
      if (!firstResponse.ok) {
        throw new Error(`Product request failed (${firstResponse.status}).`);
      }
      const firstBatch = await readJsonResponse<Product[]>(firstResponse, []);
      const total = Number(firstResponse.headers.get("X-Total-Count"));
      if (!Number.isFinite(total)) {
        throw new Error("Product response did not include a valid total count.");
      }

      const offsets = Array.from(
        { length: Math.ceil(Math.max(0, total - firstBatch.length) / pageSize) },
        (_, index) => (index + 1) * pageSize
      );
      const remainingBatches = await Promise.all(
        offsets.map(async (offset) => {
          const response = await fetch(
            `/api/products?limit=${pageSize}&offset=${offset}`,
            { cache: "no-store" }
          );
          if (!response.ok) {
            throw new Error(`Product request failed (${response.status}).`);
          }
          return readJsonResponse<Product[]>(response, []);
        })
      );

      if (active) setProducts([...firstBatch, ...remainingBatches.flat()]);
    }

    loadAllProducts()
      .catch((error: unknown) => {
        console.error("Failed to load shop products:", error);
        if (active) {
          setProductLoadError("Products could not be loaded. Please try again.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    fetch("/api/categories", { cache: "no-store" })
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
      const term = search.trim().toLowerCase();
      data = data.filter((item) =>
        [
          item.name,
          item.slug,
          item.sku,
          item.shortDescription,
          item.description,
          item.brand,
          item.productType,
          item.fabric,
          item.season,
          item.category?.name,
        ].some((value) => value?.toLowerCase().includes(term))
      );
    }

    if (saleOnly) {
      data = data.filter(
        (item) =>
          item.onSale === true ||
          (item.onSale === undefined &&
            typeof item.discountPrice === "number" &&
            item.discountPrice > 0 &&
            item.discountPrice < item.price)
      );
    }

    if (selectedCategory) {
      data = data.filter((item) => {
        if (item.category?._id === selectedCategory) return true;
        const categoryName = item.category?.name.toLowerCase() ?? "";
        if (["men", "mens", "men's"].includes(selectedCategory)) {
          return /\bmen\b|\bmens\b|\bmenswear\b/.test(categoryName);
        }
        if (["women", "womens", "women's"].includes(selectedCategory)) {
          return /\bwomen\b|womens/.test(categoryName);
        }
        if (["boy", "boys"].includes(selectedCategory)) {
          return /\bboys?\b/.test(categoryName);
        }
        if (selectedCategory === "girls") return /\bgirls?\b/.test(categoryName);
        if (["accessory", "accessories"].includes(selectedCategory)) {
          return /\baccessor(y|ies)\b/.test(categoryName);
        }
        return categoryName === selectedCategory;
      });
    }

    if (selectedGenders.length > 0) {
      data = data.filter((item) =>
        selectedGenders.includes(
          getProductGender(item.gender, item.category?.name ?? "")
        )
      );
    }

    if (selectedCollection) {
      data = data.filter(
        (item) =>
          item.collection?._id === selectedCollection ||
          item.collections?.some((collection) => collection._id === selectedCollection)
      );
    }

    if (selectedSize) {
      data = data.filter((item) => item.sizes?.includes(selectedSize));
    }

    if (selectedSizes.length > 0) {
      data = data.filter((item) =>
        selectedSizes.some((size) => item.sizes?.includes(size))
      );
    }

    if (selectedColor) {
      data = data.filter((item) => item.colors?.includes(selectedColor));
    }

    if (selectedSeasons.length > 0) {
      data = data.filter((item) =>
        selectedSeasons.some(
          (season) => item.season?.toLowerCase() === season.toLowerCase()
        )
      );
    }

    if (selectedFabrics.length > 0) {
      data = data.filter((item) =>
        selectedFabrics.some(
          (fabric) => item.fabric?.toLowerCase() === fabric.toLowerCase()
        )
      );
    }

    if (selectedBrands.length > 0) {
      data = data.filter((item) =>
        selectedBrands.includes(item.brand?.trim() ?? "")
      );
    }

    if (selectedProductTypes.length > 0) {
      data = data.filter((item) =>
        selectedProductTypes.includes(item.productType?.trim() ?? "")
      );
    }

    data = data.filter(
      (item) =>
        getProductPrice(item) >= minimumPrice &&
        (priceRange >= 100000 || getProductPrice(item) <= priceRange)
    );

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
    selectedGenders,
    selectedCollection,
    selectedSize,
    selectedSizes,
    selectedColor,
    selectedSeasons,
    selectedFabrics,
    selectedBrands,
    selectedProductTypes,
    priceRange,
    minimumPrice,
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
      (normalizedQuery === "men" && category.routeGroup === "men") ||
      (normalizedQuery === "women" && category.routeGroup === "women") ||
      (normalizedQuery === "girls" && category.routeGroup === "girls") ||
      (["boy", "boys"].includes(normalizedQuery) && category.routeGroup === "boys") ||
      (["accessories", "accessory"].includes(normalizedQuery) &&
        category.routeGroup === "accessories") ||
      (normalizedQuery === "girls" &&
        (/\bgirls?\b/.test(name) || /\bgirls?\b/.test(slug ?? ""))) ||
      (["men", "mens", "men's"].includes(normalizedQuery) &&
        (/\bmen\b|\bmens\b|\bmenswear\b/.test(name) ||
          /\bmen\b|\bmens\b|\bmenswear\b/.test(slug ?? ""))) ||
      (normalizedQuery === "women" &&
        (/\bwomen\b|womens/.test(name) || /\bwomen\b|womens/.test(slug ?? ""))) ||
      (["boy", "boys"].includes(normalizedQuery) &&
        (/\bboys?\b/.test(name) || /\bboys?\b/.test(slug ?? "")))
    );
  };
  const womenCategories = categories.filter((item) =>
    item.routeGroup === "women" || /\bwomen\b|womens/.test(
      `${item.name.trim().toLowerCase()} ${item.slug?.trim().toLowerCase() ?? ""}`
    )
  );
  const womenLandingCategory =
    womenCategories.find((item) => (item.sectionTiles?.length ?? 0) > 0) ||
    womenCategories.find(
      (item) =>
        /women('?s)?\s+wear|womens?\s+wear/.test(item.name.trim().toLowerCase()) ||
        /women('?s)?-wear|womens?-wear/.test(item.slug?.trim().toLowerCase() ?? "")
    ) ||
    womenCategories[0];
  const menCategories = categories.filter((item) =>
    item.routeGroup === "men" || /\bmen\b|\bmens\b|\bmenswear\b/.test(
      `${item.name.trim().toLowerCase()} ${item.slug?.trim().toLowerCase() ?? ""}`
    )
  );
  const menLandingCategory =
    menCategories.find(
      (item) =>
        item.name.trim().toLowerCase() === "men" ||
        item.slug?.trim().toLowerCase() === "men"
    ) ||
    menCategories.find((item) => Boolean(item.image)) ||
    menCategories.find(
      (item) =>
        /\bmen('?s)?\s+wear|\bmens?\s+wear|\bmenswear\b/.test(item.name.trim().toLowerCase()) ||
        /\bmen('?s)?-wear|\bmens?-wear|\bmenswear\b/.test(
          item.slug?.trim().toLowerCase() ?? ""
        )
    ) ||
    [...menCategories].sort((first, second) =>
      first.name.localeCompare(second.name)
    )[0];
  const boysCategories = categories.filter((item) =>
    item.routeGroup === "boys" || /\bboys?\b/.test(
      `${item.name.trim().toLowerCase()} ${item.slug?.trim().toLowerCase() ?? ""}`
    )
  );
  const boysLandingCategory =
    boysCategories.find((item) => (item.sectionTiles?.length ?? 0) > 0) ||
    boysCategories.find(
      (item) =>
        /\bboys?\s+wear/.test(item.name.trim().toLowerCase()) ||
        /\bboys?-wear/.test(item.slug?.trim().toLowerCase() ?? "")
    ) ||
    boysCategories[0];
  const girlsCategories = categories.filter((item) =>
    item.routeGroup === "girls" || /\bgirls?\b/.test(
      `${item.name.trim().toLowerCase()} ${item.slug?.trim().toLowerCase() ?? ""}`
    )
  );
  const girlsLandingCategory =
    girlsCategories.find((item) => (item.sectionTiles?.length ?? 0) > 0) ||
    girlsCategories.find(
      (item) =>
        /girls?\s+wear/.test(item.name.trim().toLowerCase()) ||
        /girls?-wear/.test(item.slug?.trim().toLowerCase() ?? "")
    ) ||
    girlsCategories[0];
  const accessoriesCategories = categories.filter((item) =>
    item.routeGroup === "accessories" || /\baccessor(y|ies)\b/.test(
      `${item.name.trim().toLowerCase()} ${item.slug?.trim().toLowerCase() ?? ""}`
    )
  );
  const accessoriesLandingCategory =
    accessoriesCategories.find((item) => (item.sectionTiles?.length ?? 0) > 0) ||
    accessoriesCategories.find((item) =>
      /^(accessory|accessories)$/.test(item.name.trim().toLowerCase()) ||
      /^(accessory|accessories)$/.test(item.slug?.trim().toLowerCase() ?? "")
    ) ||
    accessoriesCategories[0];
  const isBoysProductListing = ["boy", "boys"].includes(
    categoryQuery.trim().toLowerCase()
  );
  const isMenProductListing = ["men", "mens", "men's"].includes(
    categoryQuery.trim().toLowerCase()
  );
  const isWomenProductListing = ["women", "womens", "women's"].includes(
    categoryQuery.trim().toLowerCase()
  );
  const isGirlsProductListing =
    categoryQuery.trim().toLowerCase() === "girls";
  const isAccessoriesProductListing = ["accessories", "accessory"].includes(
    categoryQuery.trim().toLowerCase()
  );
  const isDepartmentProductListing =
    isGirlsProductListing ||
    isWomenProductListing ||
    isMenProductListing ||
    isBoysProductListing ||
    isAccessoriesProductListing;
  const isSaleListing = saleQuery === "true";
  const departmentName = isBoysProductListing
    ? "Boys"
    : isMenProductListing
      ? "Men"
      : isWomenProductListing
        ? "Women"
        : isAccessoriesProductListing
          ? "Accessories"
          : "Girls";
  const departmentLandingCategory = isBoysProductListing
    ? boysLandingCategory
    : isMenProductListing
      ? menLandingCategory
      : isWomenProductListing
        ? womenLandingCategory
        : isAccessoriesProductListing
          ? accessoriesLandingCategory
          : girlsLandingCategory;
  const departmentProducts = products.filter((product) =>
    isBoysProductListing
      ? product.category?.routeGroup === "boys" || /\bboys?\b/.test(product.category?.name?.toLowerCase() ?? "")
      : isMenProductListing
        ? product.category?.routeGroup === "men" || /\bmen\b|\bmens\b|\bmenswear\b/.test(
            product.category?.name?.toLowerCase() ?? ""
          )
        : isWomenProductListing
          ? product.category?.routeGroup === "women" || /\bwomen\b|womens/.test(product.category?.name?.toLowerCase() ?? "")
            : isAccessoriesProductListing
              ? product.category?.routeGroup === "accessories" || /\baccessor(y|ies)\b/.test(product.category?.name?.toLowerCase() ?? "")
              : product.category?.routeGroup === "girls" || /\bgirls?\b/.test(product.category?.name?.toLowerCase() ?? "")
  );
  const departmentProductsCount = departmentProducts.length;
  const seasonOptions = Array.from(
    new Set(departmentProducts.map((product) => product.season?.trim()).filter(Boolean))
  ).sort((a, b) => a!.localeCompare(b!)) as string[];
  const fabricOptions = Array.from(
    new Set(departmentProducts.map((product) => product.fabric?.trim()).filter(Boolean))
  ).sort((a, b) => a!.localeCompare(b!)) as string[];
  const sizeOptions = sortProductSizes(Array.from(
    new Set(departmentProducts.flatMap((product) => product.sizes ?? []))
  ));
  const highestDepartmentPrice = Math.max(
    ...departmentProducts.map((product) => getProductPrice(product)),
    0
  );
  const activeCategory =
    categories.find((item) => item._id === selectedCategory) ||
    (selectedCategory === "girls"
      ? girlsLandingCategory
      : selectedCategory === "women"
        ? womenLandingCategory
        : ["men", "mens", "men's"].includes(selectedCategory)
          ? menLandingCategory
          : ["boy", "boys"].includes(selectedCategory)
            ? boysLandingCategory
          : ["accessories", "accessory"].includes(selectedCategory)
            ? accessoriesLandingCategory
          : undefined) ||
    categories.find((item) => matchesCategoryQuery(item, selectedCategory));
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
      : isSaleListing
        ? "Sale"
      : categoryName === "All Products"
        ? "Shop All Products"
        : categoryName;
  const bannerCategory =
    (isSaleListing
      ? categories.find(
          (item) =>
            item.status !== false &&
            /^(sale|sale collection|sale products)$/i.test(item.name.trim())
        )
      : activeCategory) ||
    (isDepartmentProductListing ? departmentLandingCategory : undefined);
  const categoryHeroProduct = products.find(
    (product) => product.category?._id === activeCategory?._id
  );
  const fallbackHeroProduct = isDepartmentProductListing
    ? departmentProducts[0]
    : isSaleListing
      ? filteredProducts[0] || products[0]
      : products[0];
  const heroImage =
    bannerCategory?.bannerImage ||
    bannerCategory?.image ||
    (categoryHeroProduct ? getProductImage(categoryHeroProduct) : undefined) ||
    fallbackHeroProduct?.images?.[0] ||
    fallbackHeroProduct?.image;
  const departmentSectionTiles =
    isDepartmentProductListing ||
    (activeCategory &&
      (isWomenProductListing
        ? /\bwomen\b|womens/.test(activeCategory.name.trim().toLowerCase())
        : isBoysProductListing
          ? /\bboys?\b/.test(activeCategory.name.trim().toLowerCase())
          : isMenProductListing
            ? /\bmen\b|\bmens\b|\bmenswear\b/.test(
                activeCategory.name.trim().toLowerCase()
              )
            : isAccessoriesProductListing
              ? /\baccessor(y|ies)\b/.test(
                  activeCategory.name.trim().toLowerCase()
                )
              : /\bgirls?\b/.test(activeCategory.name.trim().toLowerCase())))
      ? (departmentLandingCategory?.sectionTiles ?? activeCategory?.sectionTiles)?.filter(
          (tile) => tile.title && tile.image && tile.category
        ) ?? []
      : [];
  const categoryHrefForTile = (tileCategory: string) => {
    const match = categories.find((item) =>
      [item.name, item.slug].some(
        (value) => value?.trim().toLowerCase() === tileCategory.trim().toLowerCase()
      )
    );
    if (!match) return `/shop?category=${encodeURIComponent(tileCategory)}`;
    if (match.routeGroup) return `/shop/${match.routeGroup}/${match.slug}`;
    const parent = categories.find((item) => item._id === match.parentCategory);
    return parent?.slug
      ? `/shop/${parent.slug}/${match.slug}`
      : `/shop/${match.slug}`;
  };
  const isDepartmentLanding =
    isDepartmentProductListing && !viewAllQuery;

  const sizeFilterOptions = Array.from(
    new Set(products.flatMap((product) => product.sizes ?? []))
  );
  const sortedSizeFilterOptions = sortProductSizes(sizeFilterOptions);
  const colorFilterOptions = Array.from(
    new Set(products.flatMap((product) => product.colors ?? []))
  ).sort((a, b) => a.localeCompare(b));
  const COLOR_OPTIONS = colorFilterOptions.map((name) => ({
    name,
    value: /^#(?:[\da-f]{3}){1,2}$/i.test(name)
      ? name
      : ({
          black: "#171717",
          navy: "#193655",
          gray: "#9ca3af",
          grey: "#9ca3af",
          beige: "#cbb79b",
          green: "#47745b",
          brown: "#81513a",
          white: "#ffffff",
        } as Record<string, string>)[name.toLowerCase()] ?? "#cbd5e1",
  }));
  const brandFilterOptions = Array.from(
    new Set(products.map((product) => product.brand?.trim()).filter(
      (brand): brand is string => Boolean(brand)
    ))
  ).sort((a, b) => a.localeCompare(b));
  const productTypeFilterOptions = Array.from(
    new Set(products.map((product) => product.productType?.trim()).filter(
      (productType): productType is string => Boolean(productType)
    ))
  )
    .filter((productType) =>
      productType.toLowerCase() !== "men" &&
      !CATEGORY_CATALOG.some(
        (category) => category.name.toLowerCase() === productType.toLowerCase()
      )
    )
    .sort((a, b) => a.localeCompare(b));
  const genderFilterOptions = Array.from(
    new Set(products.map((product) =>
      getProductGender(product.gender, product.category?.name ?? "")
    ).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
  const activeCategoryFilter =
    categories.find(
      (category) =>
        category._id === selectedCategory ||
        matchesCategoryQuery(category, selectedCategory)
    )?._id ?? selectedCategory;
  const activeFilterValues: ProductFilterValues = {
    ...EMPTY_PRODUCT_FILTERS,
    category: activeCategoryFilter ? [activeCategoryFilter] : [],
    collection: selectedCollection ? [selectedCollection] : [],
    gender: selectedGenders,
    size: selectedSizes.length
      ? selectedSizes
      : selectedSize
        ? [selectedSize]
        : [],
    color: selectedColor ? [selectedColor] : [],
    brand: selectedBrands,
    productType: selectedProductTypes,
    fabric: selectedFabrics,
    season: selectedSeasons,
    minPrice: minimumPrice,
    maxPrice: priceRange >= 100000 ? 0 : priceRange,
    availability: inStockOnly,
    onSale: saleOnly,
  };
  const shopFilterOptions = {
    category: categories
      .filter((category) => {
        const route = categoryQuery.toLowerCase();
        if (["men", "mens", "men's"].includes(route)) return category.routeGroup === "men";
        if (["women", "womens", "women's"].includes(route)) return category.routeGroup === "women";
        if (["girls", "girl"].includes(route)) return category.routeGroup === "girls";
        if (["boys", "boy"].includes(route)) return category.routeGroup === "boys";
        if (["accessories", "accessory"].includes(route)) return category.routeGroup === "accessories";
        return true;
      })
      .map((category) => ({
        value: category._id,
        label: category.name,
      })),
    collection: collections.map((collection) => ({
      value: collection._id,
      label: collection.title,
    })),
    gender: genderFilterOptions.map((gender) => ({ value: gender, label: gender })),
    size: sortedSizeFilterOptions.map((size) => ({ value: size, label: size })),
    color: colorFilterOptions.map((color) => ({ value: color, label: color })),
    brand: brandFilterOptions.map((brand) => ({ value: brand, label: brand })),
    productType: productTypeFilterOptions.map((productType) => ({
      value: productType,
      label: productType,
    })),
    fabric: fabricOptions.map((fabric) => ({ value: fabric, label: fabric })),
    season: seasonOptions.map((season) => ({ value: season, label: season })),
  };

  function applyDrawerFilters(filters: ProductFilterValues) {
    setSelectedCategory(filters.category[0] ?? "");
    setSelectedCollection(filters.collection[0] ?? "");
    setSelectedGenders(filters.gender);
    setSelectedSize("");
    setSelectedSizes(filters.size);
    setSelectedColor(filters.color[0] ?? "");
    setSelectedBrands(filters.brand);
    setSelectedProductTypes(filters.productType);
    setSelectedFabrics(filters.fabric);
    setSelectedSeasons(filters.season);
    setMinimumPrice(filters.minPrice);
    setPriceRange(filters.maxPrice || 100000);
    setInStockOnly(filters.availability);
    setSaleOnly(filters.onSale || isSaleListing);
    setCurrentPage(1);
  }

  function resetFilters() {
    setSearch("");
    setSelectedCategory("");
    setSelectedCollection("");
    setSelectedSize("");
    setSelectedSizes([]);
    setSelectedColor("");
    setSelectedSeasons([]);
    setSelectedFabrics([]);
    setSelectedBrands([]);
    setSelectedProductTypes([]);
    setSelectedGenders([]);
    setPriceRange(100000);
    setMinimumPrice(0);
    setInStockOnly(false);
    setSaleOnly(false);
    setSort("latest");
    setCurrentPage(1);
  }

  function clearSaleFilters() {
    setSearch("");
    setSelectedCategory("");
    setSelectedCollection("");
    setSelectedSize("");
    setSelectedSizes([]);
    setSelectedColor("");
    setSelectedSeasons([]);
    setSelectedFabrics([]);
    setPriceRange(100000);
    setMinimumPrice(0);
    setInStockOnly(false);
    setSaleOnly(true);
    setSort("latest");
    setCurrentPage(1);
  }

  return (
    <main className="min-h-screen bg-white pb-12 text-[#102d40]">
      <section aria-label={`${heroTitle} introduction`}>
        <nav
          aria-label="Breadcrumb"
          className="mx-auto flex max-w-[1440px] items-center gap-1.5 px-4 py-3 text-xs text-[#536875] sm:px-6"
        >
          <Link href="/" className="hover:text-[#6f1d46]">Home</Link>
          <ChevronRight size={13} aria-hidden="true" />
          {isSaleListing ? (
            <span className="font-medium text-[#6f1d46]">Sale</span>
          ) : (
            <>
              <Link href="/shop" className="hover:text-[#6f1d46]">Shop</Link>
              <ChevronRight size={13} aria-hidden="true" />
              <span className="font-medium text-[#6f1d46]">{heroTitle}</span>
            </>
          )}
        </nav>
        <HeroBanner
          name={heroTitle}
          image={heroImage}
          title={bannerCategory?.bannerTitle}
          description={bannerCategory?.bannerDescription}
          buttonText={bannerCategory?.bannerButtonText || (isSaleListing ? "Shop Sale" : "Discover Collection")}
          buttonLink={
            bannerCategory?.bannerButtonLink ||
            (isSaleListing
              ? "/shop?sale=true"
              : isDepartmentProductListing
                ? `/shop?category=${encodeURIComponent(categoryQuery || departmentName)}`
                : bannerCategory?.slug
                  ? `/shop/${bannerCategory.slug}`
                  : "#shop-products")
          }
          position={bannerCategory?.bannerPosition}
          imageAlt={`${heroTitle} fashion collection`}
          priority
        />
      </section>

      {departmentSectionTiles.length > 0 && (
        <section
          aria-labelledby="department-category-tiles-title"
          className="bg-white px-4 py-8 sm:px-6 sm:py-10 lg:py-12"
        >
          <div className="mx-auto max-w-5xl">
            <h2
              id="department-category-tiles-title"
              className="mb-6 text-center text-2xl font-medium tracking-wide text-[#102d40] sm:mb-8 sm:text-3xl"
            >
              {departmentName.toUpperCase()}
            </h2>
            <div className="grid grid-cols-2 justify-items-center gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-9 lg:grid-cols-4">
              {departmentSectionTiles.map((tile, index) => (
                <Link
                  key={`${tile.title}-${index}`}
                  href={categoryHrefForTile(tile.category)}
                  className="group flex w-full max-w-48 flex-col items-center text-center"
                >
                  <span className="relative block aspect-square w-32 overflow-hidden rounded-full bg-[#f3f4f5] sm:w-36 lg:w-40">
                    <Image
                      src={tile.image}
                      alt={tile.title}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 128px, 160px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </span>
                  <span className="mt-3 text-xs font-medium uppercase tracking-wide text-[#102d40] sm:text-sm">
                    {tile.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {isDepartmentLanding && !isDepartmentProductListing ? (
        <section
          aria-labelledby="girls-products-title"
          className="bg-white py-5 sm:py-7"
        >
          <div className="mx-auto max-w-[1440px] px-3 sm:px-6 lg:px-8">
            <div className="mb-3 flex items-center justify-between">
              <h2
                id="department-products-title"
                className="text-sm font-bold tracking-tight text-[#172a33] sm:text-base"
              >
                {departmentName} Wear
              </h2>
              <Link
                href={`/shop?category=${departmentName}&view=all`}
                className="text-[10px] font-semibold text-[#172a33] transition hover:text-primary sm:text-xs"
              >
                View All →
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 lg:gap-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={index}
                    className="aspect-[1.35] animate-pulse rounded-md bg-slate-100"
                  />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">
                No {departmentName} Wear products are available yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 lg:gap-4">
                {filteredProducts.slice(0, 4).map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product as StoreProductCardData}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {!isDepartmentProductListing && !isSaleListing && (
        <div className="mb-4 flex items-center justify-end lg:hidden">
          <p className="text-sm font-semibold">
            {filteredProducts.length} Products
          </p>
        </div>
        )}

        <div
          className={
            isDepartmentProductListing
              ? showFilters
                ? "block space-y-4"
                : "block"
              : isSaleListing
                ? "block"
                : "grid gap-6 lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-8"
          }
        >
          {!isDepartmentProductListing && !isSaleListing && (
          <aside
            className="hidden"
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
                      className="text-xs font-medium text-[#102d40] hover:underline"
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
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#102d40]"
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
                className="w-full accent-[#102d40]"
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
                        selectedColor === color.name ? "ring-2 ring-[#102d40] ring-offset-1" : ""
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
                  className="accent-[#102d40]"
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
                  className="accent-[#102d40]"
                />
                On sale
              </label>
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-semibold text-[#102d40] hover:underline"
              >
                Reset all filters
              </button>
            </div>
          </aside>
          )}

          <section id="shop-products" aria-label={`${heroTitle} products`} className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-4">
                <ProductFilterDrawer
                  options={shopFilterOptions}
                  value={activeFilterValues}
                  priceCeiling={100000}
                  onApply={applyDrawerFilters}
                  showCategory={categories.length > 0}
                  showGender={genderFilterOptions.length > 0}
                  singleSelectKeys={["category", "collection"]}
                />
                {!isDepartmentProductListing && !isSaleListing && (
                  <p className="hidden text-sm font-semibold sm:block">
                    All Products <span className="text-slate-500">({filteredProducts.length})</span>
                  </p>
                )}
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-3 sm:gap-5">
                {(isDepartmentProductListing || isSaleListing) && (
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-600 sm:text-xs">
                    {isSaleListing
                      ? `${filteredProducts.length} products`
                      : `${filteredProducts.length} of ${departmentProductsCount} products`}
                  </p>
                )}
                <label className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-slate-600 sm:text-xs">
                Sort by
                <span className="relative">
                  <select
                    value={sort}
                    onChange={(event) => {
                      setSort(event.target.value);
                      setCurrentPage(1);
                    }}
                    className="appearance-none rounded-md border border-[#e7edf1] bg-white py-2 pl-3 pr-8 text-[10px] font-medium uppercase text-[#536875] outline-none focus:border-[#102d40] sm:text-xs"
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
            </div>

            {isLoading ? (
              <div className={`grid grid-cols-2 gap-3 sm:gap-5 ${viewAllQuery || isDepartmentProductListing || isSaleListing ? "lg:grid-cols-4" : "xl:grid-cols-3"}`}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-[300px] animate-pulse rounded-xl bg-white sm:h-[370px]" />
                ))}
              </div>
            ) : (
              <div className={`grid grid-cols-2 gap-3 sm:gap-5 ${viewAllQuery || isDepartmentProductListing || isSaleListing ? "lg:grid-cols-4" : "xl:grid-cols-3"}`}>
                {productLoadError ? (
                  <div role="alert" className="col-span-full rounded-xl border border-rose-200 bg-rose-50 px-5 py-12 text-center text-sm text-rose-800">
                    {productLoadError}
                  </div>
                ) : paginatedProducts.length === 0 ? (
                  <div className="col-span-full rounded-xl border border-slate-200 bg-white px-5 py-16 text-center">
                    <h2 className="text-xl font-semibold text-slate-800">No products found</h2>
                    <p className="mt-2 text-sm text-slate-500">Try changing your filters.</p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-4 text-sm font-semibold text-[#102d40] hover:underline"
                    >
                      Reset filters
                    </button>
                  </div>
                ) : (
                  paginatedProducts.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product as StoreProductCardData}
                    />
                  ))
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
      )}
      {isSaleListing && showFilters && (
        <div className="fixed inset-0 z-[1000]">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setShowFilters(false)}
            className="absolute inset-0 bg-black/30"
          />
          <section
            id="sale-filter-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sale-filter-title"
            className="absolute inset-0 flex h-full w-full flex-col bg-white shadow-2xl sm:left-auto sm:w-[min(100%,560px)]"
          >
            <header className="flex h-14 shrink-0 items-center justify-center border-b border-[#e7e7e7]">
              <h2
                id="sale-filter-title"
                className="text-base font-semibold text-[#102d40]"
              >
                Filter
              </h2>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                aria-label="Close filters"
                className="absolute right-4 top-3 flex size-8 items-center justify-center text-[#333] hover:text-black"
              >
                <X size={25} strokeWidth={1.4} />
              </button>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <div className="border-b border-[#e7e7e7] pb-5">
                <label htmlFor="sale-filter-search" className="mb-2 block text-sm font-semibold">
                  Search
                </label>
                <input
                  id="sale-filter-search"
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search sale products"
                  className="h-10 w-full border border-[#ddd8d2] px-3 text-sm outline-none focus:border-[#102d40]"
                />
              </div>

              <div className="border-b border-[#e7e7e7] pb-5">
                <h3 className="mb-3 text-sm font-semibold">Category</h3>
                <div className="max-h-48 space-y-3 overflow-y-auto">
                  <label className="flex cursor-pointer items-center gap-3 text-sm text-[#555]">
                    <input
                      type="radio"
                      name="sale-category"
                      checked={!selectedCategory}
                      onChange={() => {
                        setSelectedCategory("");
                        setCurrentPage(1);
                      }}
                      className="accent-[#102d40]"
                    />
                    All categories
                  </label>
                  {categories.map((category) => (
                    <label
                      key={category._id}
                      className="flex cursor-pointer items-center gap-3 text-sm text-[#555]"
                    >
                      <input
                        type="radio"
                        name="sale-category"
                        checked={
                          selectedCategory === category._id ||
                          matchesCategoryQuery(category, selectedCategory)
                        }
                        onChange={() => {
                          setSelectedCategory(category._id);
                          setCurrentPage(1);
                        }}
                        className="accent-[#102d40]"
                      />
                      {category.name}
                    </label>
                  ))}
                </div>
              </div>

              {collections.length > 0 && (
                <div className="border-b border-[#e7e7e7] pb-5">
                  <h3 className="mb-3 text-sm font-semibold">Collection</h3>
                  <div className="max-h-40 space-y-3 overflow-y-auto">
                    <label className="flex cursor-pointer items-center gap-3 text-sm text-[#555]">
                      <input
                        type="radio"
                        name="sale-collection"
                        checked={!selectedCollection}
                        onChange={() => {
                          setSelectedCollection("");
                          setCurrentPage(1);
                        }}
                        className="accent-[#102d40]"
                      />
                      All collections
                    </label>
                    {collections.map((collection) => (
                      <label
                        key={collection._id}
                        className="flex cursor-pointer items-center gap-3 text-sm text-[#555]"
                      >
                        <input
                          type="radio"
                          name="sale-collection"
                          checked={selectedCollection === collection._id}
                          onChange={() => {
                            setSelectedCollection(collection._id);
                            setCurrentPage(1);
                          }}
                          className="accent-[#102d40]"
                        />
                        {collection.title}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-b border-[#e7e7e7] pb-5">
                <h3 className="mb-3 text-sm font-semibold">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {["S", "M", "L", "XL", "XXL"].map((size) => (
                    <button
                      key={size}
                      type="button"
                      aria-pressed={selectedSize === size || selectedSizes.includes(size)}
                      onClick={() => {
                        setSelectedSize("");
                        setSelectedSizes((selected) =>
                          selected.includes(size)
                            ? selected.filter((item) => item !== size)
                            : [...selected, size]
                        );
                        setCurrentPage(1);
                      }}
                      className={`min-h-9 min-w-9 border px-2 text-xs font-medium ${
                        selectedSize === size || selectedSizes.includes(size)
                          ? "border-[#102d40] bg-[#102d40] text-white"
                          : "border-[#ddd8d2] bg-white text-[#555]"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-b border-[#e7e7e7] pb-5">
                <h3 className="mb-3 text-sm font-semibold">Color</h3>
                <div className="flex flex-wrap gap-3">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      title={color.name}
                      aria-label={color.name}
                      aria-pressed={selectedColor === color.name}
                      onClick={() => {
                        setSelectedColor(
                          selectedColor === color.name ? "" : color.name
                        );
                        setCurrentPage(1);
                      }}
                      className={`flex size-8 items-center justify-center rounded-full border ${
                        selectedColor === color.name
                          ? "border-[#102d40] ring-1 ring-[#102d40] ring-offset-2"
                          : "border-[#ddd8d2]"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="size-5 rounded-full border border-black/10"
                        style={{ backgroundColor: color.value }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-b border-[#e7e7e7] pb-5">
                <h3 className="mb-3 text-sm font-semibold">Price</h3>
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
                  className="w-full accent-[#102d40]"
                />
                <p className="mt-1 text-xs text-[#68767d]">
                  Rs. {minimumPrice.toLocaleString()} — Rs. {priceRange.toLocaleString()}
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex cursor-pointer items-center gap-3 text-sm text-[#555]">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(event) => {
                      setInStockOnly(event.target.checked);
                      setCurrentPage(1);
                    }}
                    className="size-4 accent-[#102d40]"
                  />
                  In stock only
                </label>
                <label className="flex cursor-pointer items-center gap-3 text-sm text-[#555]">
                  <input
                    type="checkbox"
                    checked={saleOnly}
                    onChange={(event) => {
                      setSaleOnly(event.target.checked);
                      setCurrentPage(1);
                    }}
                    className="size-4 accent-[#102d40]"
                  />
                  On sale
                </label>
              </div>
            </div>

            <footer className="grid shrink-0 grid-cols-2 gap-3 border-t border-[#e7e7e7] bg-white px-5 py-4">
              <button
                type="button"
                onClick={clearSaleFilters}
                className="min-h-11 border border-[#222] text-xs font-semibold uppercase tracking-wide text-[#222]"
              >
                Remove all
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="min-h-11 bg-[#222] text-xs font-semibold uppercase tracking-wide text-white"
              >
                Apply
              </button>
            </footer>
          </section>
        </div>
      )}
      {isDepartmentProductListing && showFilters && (
        <div className="fixed inset-0 z-[1000]">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setShowFilters(false)}
            className="absolute inset-0 bg-black/30"
          />
          <section
            id="department-filter-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="department-filter-title"
            className="absolute inset-0 flex h-full w-full flex-col bg-white shadow-2xl sm:left-auto sm:w-[min(100%,560px)]"
          >
            <header className="flex h-14 shrink-0 items-center justify-center border-b border-[#e7e7e7]">
              <h2
                id="department-filter-title"
                className="text-base font-semibold text-[#102d40]"
              >
                Filter
              </h2>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                aria-label="Close filters"
                className="absolute right-4 top-3 flex size-8 items-center justify-center text-[#333] hover:text-black"
              >
                <X size={25} strokeWidth={1.4} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto">
              {filterSection ? (
                <div className="px-6 pt-5">
                  <button
                    type="button"
                    onClick={() => setFilterSection("")}
                    className="mb-5 inline-flex items-center gap-3 text-base text-[#242424]"
                  >
                    <ChevronRight
                      size={21}
                      className="rotate-180"
                      aria-hidden="true"
                    />
                    {filterSection === "season"
                      ? "Season"
                      : filterSection === "fabric"
                        ? "Fabric"
                        : filterSection === "size"
                          ? "Size"
                          : "Price"}
                  </button>

                  {filterSection === "season" &&
                    (seasonOptions.length ? (
                      <div className="space-y-5">
                        {seasonOptions.map((season) => {
                          const count = departmentProducts.filter(
                            (product) => product.season?.trim() === season
                          ).length;
                          return (
                            <label
                              key={season}
                              className="flex cursor-pointer items-center gap-4 text-sm tracking-wide text-[#555]"
                            >
                              <input
                                type="checkbox"
                                checked={selectedSeasons.includes(season)}
                                onChange={() => {
                                  setSelectedSeasons((selected) =>
                                    selected.includes(season)
                                      ? selected.filter((item) => item !== season)
                                      : [...selected, season]
                                  );
                                  setCurrentPage(1);
                                }}
                                className="size-5 accent-black"
                              />
                              <span>
                                {season} ({count})
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        No season options yet. Add a season to {departmentName} products in
                        admin.
                      </p>
                    ))}

                  {filterSection === "fabric" &&
                    (fabricOptions.length ? (
                      <div className="max-h-[calc(100dvh-190px)] space-y-5 overflow-y-auto">
                        {fabricOptions.map((fabric) => {
                          const count = departmentProducts.filter(
                            (product) => product.fabric?.trim() === fabric
                          ).length;
                          return (
                            <label
                              key={fabric}
                              className="flex cursor-pointer items-center gap-4 text-sm uppercase tracking-wide text-[#555]"
                            >
                              <input
                                type="checkbox"
                                checked={selectedFabrics.includes(fabric)}
                                onChange={() => {
                                  setSelectedFabrics((selected) =>
                                    selected.includes(fabric)
                                      ? selected.filter((item) => item !== fabric)
                                      : [...selected, fabric]
                                  );
                                  setCurrentPage(1);
                                }}
                                className="size-5 accent-black"
                              />
                              <span>
                                {fabric} ({count})
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        No fabric options yet. Add a fabric to {departmentName} products in
                        admin.
                      </p>
                    ))}

                  {filterSection === "size" && (
                    <div className="space-y-5">
                      {sizeOptions.map((size) => {
                        const count = departmentProducts.filter((product) =>
                          product.sizes?.includes(size)
                        ).length;
                        return (
                          <label
                            key={size}
                            className="flex cursor-pointer items-center gap-4 text-sm tracking-wide text-[#555]"
                          >
                            <input
                              type="checkbox"
                              checked={selectedSizes.includes(size)}
                              onChange={() => {
                                setSelectedSizes((selected) =>
                                  selected.includes(size)
                                    ? selected.filter((item) => item !== size)
                                    : [...selected, size]
                                );
                                setCurrentPage(1);
                              }}
                              className="size-5 accent-black"
                            />
                            <span>
                              {size} ({count})
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {filterSection === "price" && (
                    <div className="pt-5">
                      <p className="mb-8 text-sm tracking-wide text-[#555]">
                        The highest price is Rs.{" "}
                        {highestDepartmentPrice.toLocaleString()}
                      </p>
                      <div className="grid grid-cols-2">
                        <label className="sr-only" htmlFor="girls-price-from">
                          Price from
                        </label>
                        <input
                          id="girls-price-from"
                          type="number"
                          min={0}
                          max={priceRange}
                          value={minimumPrice || ""}
                          onChange={(event) => {
                            setMinimumPrice(
                              Math.max(0, Number(event.target.value) || 0)
                            );
                            setCurrentPage(1);
                          }}
                          placeholder="From"
                          className="h-14 min-w-0 border border-r-0 border-[#777] px-4 text-base outline-none focus:border-black"
                        />
                        <label className="sr-only" htmlFor="girls-price-to">
                          Price to
                        </label>
                        <input
                          id="girls-price-to"
                          type="number"
                          min={minimumPrice}
                          max={highestDepartmentPrice || undefined}
                          value={priceRange >= 100000 ? "" : priceRange}
                          onChange={(event) => {
                            setPriceRange(
                              Number(event.target.value) || highestDepartmentPrice
                            );
                            setCurrentPage(1);
                          }}
                          placeholder="To"
                          className="h-14 min-w-0 border border-[#777] px-4 text-base outline-none focus:border-black"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <nav aria-label="Product filter categories" className="px-6 pt-8">
                  {[
                    { id: "season", title: "Season" },
                    { id: "fabric", title: "Fabric" },
                    { id: "size", title: "Size" },
                    { id: "price", title: "Price" },
                  ].map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setFilterSection(section.id)}
                      className="flex min-h-[74px] w-full items-center justify-between text-left text-sm uppercase tracking-wide text-[#102d40]"
                    >
                      {section.title}
                      <ChevronRight size={21} strokeWidth={1.5} />
                    </button>
                  ))}
                </nav>
              )}
            </div>

            <footer className="grid h-[88px] shrink-0 grid-cols-2 items-center gap-4 border-t border-[#e7e7e7] px-6">
              <button
                type="button"
                onClick={() => {
                  setSelectedSeasons([]);
                  setSelectedFabrics([]);
                  setSelectedSizes([]);
                  setMinimumPrice(0);
                  setPriceRange(Math.max(100000, highestDepartmentPrice));
                  setCurrentPage(1);
                  setFilterSection("");
                }}
                className="justify-self-center text-sm text-[#444] underline underline-offset-4"
              >
                Remove all
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="h-11 bg-[#111] text-sm font-medium text-white transition hover:bg-[#333]"
              >
                Apply
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
