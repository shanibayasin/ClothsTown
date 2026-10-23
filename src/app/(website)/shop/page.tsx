"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Heart,
  ShoppingCart,
  Star,
  X,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { readJsonResponse } from "@/lib/api";
import ProductFilterDrawer, {
  EMPTY_PRODUCT_FILTERS,
  type ProductFilterValues,
} from "@/app/components/shop/ProductFilterDrawer";

interface Product {
  _id: string;
  name: string;
  slug: string;
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
  };
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
  stock: number;
}

interface Category {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  parentCategory?: string | null;
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
  return product.images?.[0] || product.image || "/images/placeholder-product.jpg";
}

function getProductPrice(product: Product) {
  return product.discountPrice && product.discountPrice > 0
    ? product.discountPrice
    : product.price;
}

function getProductGender(name: string) {
  const value = name.toLowerCase();
  if (/\bmen\b|men's|mens/.test(value)) return "Men";
  if (/\bwomen\b|women's|womens|ladies/.test(value)) return "Women";
  if (/\bgirls?\b/.test(value)) return "Girls";
  if (/\bboys?\b/.test(value)) return "Boys";
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
      data = data.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
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
        selectedGenders.includes(getProductGender(item.category?.name ?? ""))
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
    /\bwomen\b|womens/.test(
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
    /\bmen\b|\bmens\b|\bmenswear\b/.test(
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
    /\bboys?\b/.test(
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
    /\bgirls?\b/.test(
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
    /\baccessor(y|ies)\b/.test(
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
  const departmentProductsCount = departmentLandingCategory
    ? isAccessoriesProductListing
      ? products.filter((product) =>
          /\baccessor(y|ies)\b/.test(product.category?.name?.toLowerCase() ?? "")
        ).length
      : products.filter(
        (product) => product.category?._id === departmentLandingCategory._id
      ).length
    : filteredProducts.length;
  const departmentProducts = products.filter((product) =>
    isBoysProductListing
      ? /\bboys?\b/.test(product.category?.name?.toLowerCase() ?? "")
      : isMenProductListing
        ? /\bmen\b|\bmens\b|\bmenswear\b/.test(
            product.category?.name?.toLowerCase() ?? ""
          )
        : isWomenProductListing
          ? /\bwomen\b|womens/.test(product.category?.name?.toLowerCase() ?? "")
            : isAccessoriesProductListing
              ? /\baccessor(y|ies)\b/.test(product.category?.name?.toLowerCase() ?? "")
              : /\bgirls?\b/.test(product.category?.name?.toLowerCase() ?? "")
  );
  const seasonOptions = Array.from(
    new Set(departmentProducts.map((product) => product.season?.trim()).filter(Boolean))
  ).sort((a, b) => a!.localeCompare(b!)) as string[];
  const fabricOptions = Array.from(
    new Set(departmentProducts.map((product) => product.fabric?.trim()).filter(Boolean))
  ).sort((a, b) => a!.localeCompare(b!)) as string[];
  const sizeOptions = Array.from(
    new Set(departmentProducts.flatMap((product) => product.sizes ?? []))
  ).sort((a, b) => a.localeCompare(b));
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
  const categoryHeroProduct = products.find(
    (product) => product.category?._id === activeCategory?._id
  );
  const fallbackHeroProduct = isDepartmentProductListing
    ? departmentProducts[0]
    : isSaleListing
      ? filteredProducts[0] || products[0]
      : products[0];
  const heroImage =
    activeCategory?.image ||
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
    const parent = categories.find((item) => item._id === match.parentCategory);
    return parent?.slug
      ? `/shop/${parent.slug}/${match.slug}`
      : `/shop/${match.slug}`;
  };
  const isDepartmentLanding =
    isDepartmentProductListing && !viewAllQuery;

  const sizeFilterOptions = Array.from(
    new Set(products.flatMap((product) => product.sizes ?? []))
  ).sort((a, b) => a.localeCompare(b));
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
  ).sort((a, b) => a.localeCompare(b));
  const genderFilterOptions = Array.from(
    new Set(products.map((product) => getProductGender(product.category?.name ?? "")).filter(Boolean))
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
    category: categories.map((category) => ({
      value: category._id,
      label: category.name,
    })),
    collection: collections.map((collection) => ({
      value: collection._id,
      label: collection.title,
    })),
    gender: genderFilterOptions.map((gender) => ({ value: gender, label: gender })),
    size: sizeFilterOptions.map((size) => ({ value: size, label: size })),
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
    <main className="min-h-screen bg-[#f7f9fb] pb-12 text-[#172b3a]">
      {isDepartmentLanding ? (
        <section className="bg-white">
          <nav
            aria-label="Breadcrumb"
            className="mx-auto flex max-w-[1894px] items-center gap-1.5 px-4 py-3 text-xs text-[#303030] sm:px-6"
          >
            <Link href="/" className="hover:text-[#6f1d46]">Home</Link>
            <ChevronRight size={13} aria-hidden="true" />
            <span className="font-medium">{departmentName}</span>
          </nav>
          <div className="relative mx-auto aspect-[3.2/1] min-h-[150px] max-h-[590px] w-full max-w-[1894px] overflow-hidden bg-[#f4f1ed]">
            {heroImage && (
              <Image
                src={heroImage}
                alt={
                  isAccessoriesProductListing
                    ? "Accessories collection"
                    : `${departmentName} ready-to-wear collection`
                }
                fill
                priority
                unoptimized
                sizes="100vw"
                className="object-contain"
              />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-black">
              <h1
                className="text-[clamp(3.5rem,11vw,10rem)] font-normal italic leading-[0.78] tracking-tight"
                style={{ fontFamily: '"Segoe Script", "Brush Script MT", cursive' }}
              >
                {departmentName}
              </h1>
              <p className="mt-2 text-[clamp(0.65rem,1.6vw,1.5rem)] font-medium tracking-[0.08em]">
                {isAccessoriesProductListing ? "THE FINISHING TOUCH" : "READY TO WEAR"}
              </p>
            </div>
          </div>
        </section>
      ) : isSaleListing ? (
        <section className="bg-white">
          <nav
            aria-label="Breadcrumb"
            className="mx-auto flex max-w-[1894px] items-center gap-1.5 px-4 py-3 text-xs text-[#303030] sm:px-6"
          >
            <Link href="/" className="hover:text-[#6f1d46]">Home</Link>
            <ChevronRight size={13} aria-hidden="true" />
            <span className="font-medium">Sale</span>
          </nav>
          <div className="relative mx-auto aspect-[3.2/1] min-h-[150px] max-h-[590px] w-full max-w-[1894px] overflow-hidden bg-[#f4f1ed]">
            {heroImage && (
              <Image
                src={heroImage}
                alt="Sale collection"
                fill
                priority
                sizes="100vw"
                className="object-contain"
              />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-black">
              <h1
                className="text-[clamp(3.5rem,11vw,10rem)] font-normal italic leading-[0.78] tracking-tight"
                style={{ fontFamily: '"Segoe Script", "Brush Script MT", cursive' }}
              >
                Sale
              </h1>
              <p className="mt-2 text-[clamp(0.65rem,1.6vw,1.5rem)] font-medium tracking-[0.08em]">
                SPECIAL PRICES, LIMITED TIME
              </p>
            </div>
          </div>
        </section>
      ) : (
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
      )}

      {departmentSectionTiles.length > 0 && (
        <section
          aria-labelledby="department-category-tiles-title"
          className="bg-white px-4 py-8 sm:px-6 sm:py-10 lg:py-12"
        >
          <div className="mx-auto max-w-5xl">
            <h2
              id="department-category-tiles-title"
              className="mb-6 text-center text-2xl font-medium tracking-wide text-[#171717] sm:mb-8 sm:text-3xl"
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
                {filteredProducts.slice(0, 4).map((product) => {
                  const image = getProductImage(product);
                  const price = getProductPrice(product);
                  const onSale =
                    product.onSale === true ||
                    (product.onSale === undefined && price < product.price);

                  return (
                    <article
                      key={product._id}
                      className="group min-w-0 overflow-hidden rounded-lg bg-white transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(30,41,59,0.12)]"
                    >
                      <Link
                        href={`/product/${product.slug}`}
                        className="relative block aspect-[1/1.08] overflow-hidden rounded-md bg-[#f3efec]"
                      >
                        <Image
                          src={image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 639px) 50vw, 25vw"
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.045]"
                        />
                        {(onSale || product.newArrival) && (
                          <span
                            className={`absolute left-1.5 top-1.5 rounded-sm px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white shadow-sm sm:left-2 sm:top-2 ${
                              onSale ? "bg-[#d94d68]" : "bg-[#7fa6a0]"
                            }`}
                          >
                            {onSale ? "Sale" : "New"}
                          </span>
                        )}
                      </Link>
                      <div className="px-1.5 pb-2 pt-2 sm:px-2 sm:pb-2.5">
                        <Link
                          href={`/product/${product.slug}`}
                          className="block truncate text-[11px] font-semibold leading-4 text-[#39312f] hover:text-primary sm:text-xs"
                        >
                          {product.name}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 text-[9px] sm:text-[10px]">
                          <span className="font-bold text-[#172a33]">
                            Rs. {price.toLocaleString()}
                          </span>
                          {onSale && (
                            <span className="text-[8px] text-gray-400 line-through sm:text-[9px]">
                              Rs. {product.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div
                          aria-hidden="true"
                          className="mt-1 flex gap-px text-[#f3aa21]"
                        >
                          {Array.from({ length: 5 }, (_, star) => (
                            <Star
                              key={star}
                              size={10}
                              fill="currentColor"
                              strokeWidth={0}
                            />
                          ))}
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
                          className="mt-2 flex h-7 w-full items-center justify-center gap-1 rounded-sm bg-[#102d40] px-1 text-[8px] font-semibold text-white transition hover:bg-primary disabled:cursor-not-allowed disabled:bg-slate-300 sm:text-[9px]"
                        >
                          <ShoppingCart size={11} />
                          {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                        </button>
                      </div>
                    </article>
                  );
                })}
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
          )}

          <section aria-label={`${heroTitle} products`} className="min-w-0">
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
                    className="appearance-none rounded-md border border-slate-300 bg-white py-2 pl-3 pr-8 text-[10px] font-medium uppercase text-slate-700 outline-none focus:border-[#2867b2] sm:text-xs"
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
              <div className={`grid grid-cols-2 gap-3 sm:gap-5 ${isDepartmentProductListing || isSaleListing ? "lg:grid-cols-4" : "xl:grid-cols-3"}`}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-[300px] animate-pulse rounded-xl bg-white sm:h-[370px]" />
                ))}
              </div>
            ) : (
              <div className={`grid grid-cols-2 gap-3 sm:gap-5 ${isDepartmentProductListing || isSaleListing ? "lg:grid-cols-4" : "xl:grid-cols-3"}`}>
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
                    const onSale =
                      product.onSale === true ||
                      (product.onSale === undefined && price < product.price);
                    const wished = isInWishlist(product._id);

                    return (
                      <article
                        key={product._id}
                        className="group overflow-hidden rounded-lg bg-white p-1.5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(30,41,59,0.12)] sm:p-2"
                      >
                        <div className="relative">
                          <Link
                            href={`/product/${product.slug}`}
                            aria-label={`View ${product.name}`}
                            className="relative block aspect-[1/1.08] overflow-hidden rounded-md bg-[#f3efec]"
                          >
                            <Image
                              src={image}
                              alt={product.name}
                              fill
                              sizes="(max-width: 640px) 46vw, (max-width: 1280px) 30vw, 360px"
                              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.045]"
                            />
                          </Link>
                          {(onSale || product.newArrival) && (
                            <span className="absolute left-2 top-2 rounded-sm bg-[#d94d68] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
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
                            className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-sm transition hover:scale-105 hover:text-red-500"
                          >
                            <Heart size={15} className={wished ? "fill-red-500 text-red-500" : ""} />
                          </button>
                        </div>

                        <div className="px-1 pb-1 pt-2.5">
                          <Link
                            href={`/product/${product.slug}`}
                            className="line-clamp-1 text-[11px] font-semibold leading-4 text-[#39312f] hover:text-[#2867b2] sm:text-xs"
                          >
                            {product.name}
                          </Link>
                          <p className="mt-0.5 text-[9px] text-[#817975]">
                            {product.category?.name}
                            {product.sizes?.length ? ` · ${product.sizes.join(", ")}` : ""}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs font-bold text-[#332c2a] sm:text-sm">
                              Rs. {price.toLocaleString()}
                            </span>
                            {onSale && (
                              <span className="text-[10px] text-[#a7a09c] line-through">
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
                            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-sm bg-[#33291f] py-2 text-[10px] font-semibold text-white transition-colors hover:bg-[#574331] disabled:cursor-not-allowed disabled:bg-slate-300 sm:text-xs"
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
                className="text-base font-semibold text-[#171717]"
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
                className="text-base font-semibold text-[#171717]"
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
                      className="flex min-h-[74px] w-full items-center justify-between text-left text-sm uppercase tracking-wide text-[#171717]"
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
