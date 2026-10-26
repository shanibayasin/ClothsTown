"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Plus, Trash2, UploadCloud } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { prepareImageForUpload } from "@/lib/image-upload";
import ProductForm from "./products/ProductForm";
import ProductTable, { type AdminProduct } from "./products/ProductTable";

interface Category {
  _id: string;
  name: string;
  slug?: string;
  routeGroup?: string;
  gender?: "men" | "women" | "girls" | "boys" | "unisex";
  sortOrder?: number;
  image?: string;
  bannerImage?: string;
  bannerTitle?: string;
  bannerDescription?: string;
  bannerButtonText?: string;
  bannerButtonLink?: string;
  bannerPosition?: "left" | "center" | "right";
  parentCategory?: string | null;
  sectionTiles?: SectionTile[];
  menuGroups?: AccessoriesMenuGroup[];
}

interface SectionTile {
  title: string;
  image: string;
  category: string;
}

interface AccessoriesMenuItem {
  title: string;
  category: string;
}

interface AccessoriesMenuGroup {
  title: string;
  categories: AccessoriesMenuItem[];
}

interface Collection {
  _id: string;
  title: string;
}

type ManagedSection =
  | "Girls"
  | "Women"
  | "Men"
  | "Boys"
  | "Accessories"
  | "New Arrivals";

const SECTION_CATEGORY_KEYS: Record<
  ManagedSection,
  { preferred: string[]; aliases: string[] }
> = {
  Men: {
    preferred: ["men"],
    aliases: ["mens", "men-s", "menswear", "men-wear", "mens-wear"],
  },
  Women: {
    preferred: ["women"],
    aliases: ["womens", "women-s", "womenswear", "women-wear", "womens-wear"],
  },
  Girls: {
    preferred: ["girls"],
    aliases: ["girl", "girls-wear", "girl-wear"],
  },
  Boys: {
    preferred: ["boys"],
    aliases: ["boy", "boys-wear", "boy-wear"],
  },
  Accessories: {
    preferred: ["accessories"],
    aliases: ["accessory"],
  },
  "New Arrivals": {
    preferred: ["new-arrivals"],
    aliases: ["new-arrival"],
  },
};

const SECTION_ROUTE_GROUPS: Partial<Record<ManagedSection, string>> = {
  Men: "men",
  Women: "women",
  Girls: "girls",
  Boys: "boys",
  Accessories: "accessories",
};

function normalizeCategoryKey(value: string | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function resolveSectionCategory(
  categories: Category[],
  sectionName: ManagedSection
): { category: Category | null; error: string } {
  const routeGroup = SECTION_ROUTE_GROUPS[sectionName];
  if (routeGroup) {
    const category = categories
      .filter((item) => item.routeGroup === routeGroup)
      .sort((first, second) => (first.sortOrder ?? 0) - (second.sortOrder ?? 0))[0];
    if (category) return { category, error: "" };
  }
  const keys = SECTION_CATEGORY_KEYS[sectionName];
  const normalized = categories.map((category) => ({
    category,
    name: normalizeCategoryKey(category.name),
    slug: normalizeCategoryKey(category.slug),
  }));

  for (const preferredKey of keys.preferred) {
    const slugMatch = normalized.filter((item) => item.slug === preferredKey);
    if (slugMatch.length === 1) return { category: slugMatch[0].category, error: "" };
    if (slugMatch.length > 1) {
      return {
        category: null,
        error: `More than one category uses the ${sectionName} slug. Resolve the duplicate in Categories.`,
      };
    }

    const nameMatch = normalized.filter((item) => item.name === preferredKey);
    if (nameMatch.length === 1) return { category: nameMatch[0].category, error: "" };
    if (nameMatch.length > 1) {
      return {
        category: null,
        error: `More than one category is named ${sectionName}. Resolve the duplicate in Categories.`,
      };
    }
  }

  const aliasKeys = new Set(keys.aliases);
  const aliasMatches = normalized.filter(
    (item) => aliasKeys.has(item.slug) || aliasKeys.has(item.name)
  );
  if (aliasMatches.length === 1) {
    return { category: aliasMatches[0].category, error: "" };
  }
  if (aliasMatches.length > 1) {
    return {
      category: null,
      error: `Multiple categories match ${sectionName}. Use one canonical ${sectionName} category or rename the duplicates.`,
    };
  }

  return { category: null, error: "" };
}

export default function CategorySectionManager({
  sectionName,
}: {
  sectionName: ManagedSection;
}) {
  const [sectionCategory, setSectionCategory] = useState<Category | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [setupRevision, setSetupRevision] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  const [categoryResolutionError, setCategoryResolutionError] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [bannerImage, setBannerImage] = useState("");
  const [bannerDimensions, setBannerDimensions] = useState<{ width: number; height: number } | null>(null);
  const [bannerSaved, setBannerSaved] = useState(false);
  const [sectionTiles, setSectionTiles] = useState<SectionTile[]>([]);
  const [accessoriesMenuGroups, setAccessoriesMenuGroups] = useState<
    AccessoriesMenuGroup[]
  >([]);
  const [uploadingTile, setUploadingTile] = useState<number | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);
  const [savingTiles, setSavingTiles] = useState(false);
  const [error, setError] = useState("");
  const menSubcategories =
    (sectionName === "Men" || sectionName === "Women") && sectionCategory
      ? allCategories.filter(
          (category) =>
            category._id !== sectionCategory._id &&
            (category.parentCategory === sectionCategory._id ||
              category.routeGroup === SECTION_ROUTE_GROUPS[sectionName])
        )
      : [];

  useEffect(() => {
    let active = true;

    Promise.all([
      fetch("/api/categories?admin=true", { cache: "no-store" }),
      fetch("/api/collections?admin=true", { cache: "no-store" }),
    ])
      .then(async ([categoriesResponse, collectionsResponse]) => {
        if (!categoriesResponse.ok || !collectionsResponse.ok) {
          throw new Error(`Could not load ${sectionName} product setup.`);
        }

        const [categories, loadedCollections] = await Promise.all([
          categoriesResponse.json(),
          collectionsResponse.json(),
        ]);

        if (!Array.isArray(categories) || !Array.isArray(loadedCollections)) {
          throw new Error("The product setup returned invalid data.");
        }

        return { categories, loadedCollections };
      })
      .then(({ categories, loadedCollections }) => {
        if (!active) return;

        setLoadFailed(false);
        setAllCategories(categories);
        const resolution = resolveSectionCategory(categories, sectionName);
        setCategoryResolutionError(resolution.error);
        const category = resolution.category;
        setSectionCategory(category);
        setBannerImage(category?.image ?? "");
        setSectionTiles(category?.sectionTiles ?? []);
        setAccessoriesMenuGroups(category?.menuGroups ?? []);
        setCollections(loadedCollections);
      })
      .catch((loadError: unknown) => {
        console.error(`Failed to load ${sectionName} product setup:`, loadError);
        if (active) {
          setLoadFailed(true);
          setError(
            loadError instanceof Error
              ? loadError.message
              : `Could not load ${sectionName} product setup.`
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [sectionName, setupRevision]);

  async function createSectionCategory() {
    setCreatingCategory(true);
    setError("");

    try {
      const response = await adminFetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: sectionName, image: "", status: true }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Could not create the ${sectionName} category.`);
      }

      setSectionCategory(data);
      setCategoryResolutionError("");
      setBannerImage(data.image ?? "");
      setSectionTiles(data.sectionTiles ?? []);
      setAccessoriesMenuGroups(data.menuGroups ?? []);
    } catch (categoryError) {
      console.error(`Failed to create ${sectionName} category:`, categoryError);
      setError(
        categoryError instanceof Error
          ? categoryError.message
          : `Could not create the ${sectionName} category.`
      );
    } finally {
      setCreatingCategory(false);
    }
  }

  async function uploadSectionBanner(file: File | undefined) {
    if (!file) return;

    setUploadingBanner(true);
    setError("");
    setBannerSaved(false);
    setBannerDimensions(null);

    try {
      const formData = new FormData();
      formData.append("file", await prepareImageForUpload(file));

      const response = await adminFetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || typeof data.url !== "string") {
        throw new Error(data.error || data.message || "Banner upload failed.");
      }

      setBannerImage(data.url);
    } catch (uploadError) {
      console.error(`Failed to upload ${sectionName} hero banner:`, uploadError);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Banner upload failed."
      );
    } finally {
      setUploadingBanner(false);
    }
  }

  async function saveSectionBanner() {
    if (!sectionCategory) return;

    setSavingBanner(true);
    setError("");

    try {
      const response = await adminFetch(`/api/categories/${sectionCategory._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: bannerImage }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Could not save the ${sectionName} banner.`);
      }
      if (data._id !== sectionCategory._id || data.image !== bannerImage) {
        throw new Error(`The ${sectionName} banner was not confirmed as saved. Please try again.`);
      }

      setSectionCategory(data);
      setBannerImage(data.image ?? "");
      setBannerSaved(true);
    } catch (saveError) {
      console.error(`Failed to save ${sectionName} hero banner:`, saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : `Could not save the ${sectionName} banner.`
      );
    } finally {
      setSavingBanner(false);
    }
  }

  async function uploadSectionTile(file: File | undefined, index: number) {
    if (!file) return;

    setUploadingTile(index);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", await prepareImageForUpload(file));

      const response = await adminFetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || typeof data.url !== "string") {
        throw new Error(data.error || data.message || "Image upload failed.");
      }

      setSectionTiles((tiles) =>
        tiles.map((tile, tileIndex) =>
          tileIndex === index ? { ...tile, image: data.url } : tile
        )
      );
    } catch (uploadError) {
      console.error(`Failed to upload ${sectionName} section tile image:`, uploadError);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Image upload failed."
      );
    } finally {
      setUploadingTile(null);
    }
  }

  async function saveSectionTiles() {
    if (!sectionCategory) return;
    if (
      sectionTiles.some(
        (tile) => !tile.title.trim() || !tile.image || !tile.category.trim()
      )
    ) {
      setError(`Each ${sectionName} tile needs a title, image, and category to open.`);
      return;
    }

    setSavingTiles(true);
    setError("");

    try {
      const response = await adminFetch(`/api/categories/${sectionCategory._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionTiles: sectionTiles.map((tile) => ({
            title: tile.title.trim(),
            image: tile.image,
            category: tile.category.trim(),
          })),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Could not save ${sectionName} section tiles.`);
      }

      setSectionCategory(data);
      setSectionTiles(data.sectionTiles ?? []);
    } catch (saveError) {
      console.error(`Failed to save ${sectionName} section tiles:`, saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : `Could not save ${sectionName} section tiles.`
      );
    } finally {
      setSavingTiles(false);
    }
  }

  async function saveAccessoriesMenu() {
    if (!sectionCategory) return;
    if (
      accessoriesMenuGroups.some(
        (group) =>
          !group.title.trim() ||
          group.categories.some(
            (item) => !item.title.trim() || !item.category.trim()
          )
      )
    ) {
      setError("Each Accessories menu group and category needs a name and category.");
      return;
    }

    setSavingTiles(true);
    setError("");

    try {
      const response = await adminFetch(`/api/categories/${sectionCategory._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuGroups: accessoriesMenuGroups.map((group) => ({
            title: group.title.trim(),
            categories: group.categories.map((item) => ({
              title: item.title.trim(),
              category: item.category.trim(),
            })),
          })),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save the Accessories menu.");
      }

      setSectionCategory(data);
      setAccessoriesMenuGroups(data.menuGroups ?? []);
    } catch (saveError) {
      console.error("Failed to save Accessories menu:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save the Accessories menu."
      );
    } finally {
      setSavingTiles(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-4 rounded-xl border border-[#e9e5df] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="text-xs font-medium text-slate-500">
            <Link href="/admin" className="transition hover:text-[#2867b2]">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/admin" className="transition hover:text-[#2867b2]">Store Sections</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-700">{sectionName}</span>
          </nav>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#24211e]">
            {sectionName} Products
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {sectionName === "Men"
              ? "Manage all products displayed in the Men section of the storefront."
              : `Add and manage products shown in the ${sectionName} section of your store.`}
          </p>
        </div>
        {(sectionName === "Men" || sectionName === "Women") && sectionCategory && (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setIsProductFormOpen((open) => !open);
            }}
            disabled={loading || !sectionCategory}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#2867b2] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#205796] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={16} aria-hidden="true" />
            {isProductFormOpen ? "Close Product Form" : "Add Product"}
          </button>
        )}
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div aria-label={`Loading ${sectionName} section`} className="animate-pulse space-y-4">
          <div className="rounded-xl border border-[#e9e5df] bg-white p-5">
            <div className="h-5 w-40 rounded bg-slate-100" />
            <div className="mt-3 aspect-[16/6] rounded-lg bg-slate-100" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={`section-summary-${index}`} className="h-20 rounded-xl border border-[#e9e5df] bg-white" />
            ))}
          </div>
        </div>
      ) : loadFailed ? (
        <section className="rounded-xl border border-[#e9e5df] bg-white p-8 text-center shadow-sm">
          <button
            type="button"
            onClick={() => {
              setError("");
              setLoading(true);
              setSetupRevision((revision) => revision + 1);
            }}
            className="rounded-lg bg-[#2867b2] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#205796]"
          >
            Retry loading {sectionName} setup
          </button>
        </section>
      ) : sectionCategory || sectionName === "New Arrivals" ? (
        <>
          {sectionCategory && <section className="rounded-xl border border-[#e9e5df] bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4">
              <h2 className="text-base font-bold text-[#24211e]">
                {sectionName} Hero Banner
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                This image appears in the {sectionName} storefront hero section.
              </p>
            </div>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)]">
              <div>
                <div className="relative aspect-[16/6] min-h-36 overflow-hidden rounded-xl border border-slate-200 bg-[#f5f7fa]">
                  {bannerImage ? (
                    <Image
                      src={bannerImage}
                      alt={`${sectionName} hero banner preview`}
                      fill
                      unoptimized
                      sizes="(max-width: 1024px) 100vw, 800px"
                      onLoad={(event) => {
                        const image = event.currentTarget;
                        setBannerDimensions({
                          width: image.naturalWidth,
                          height: image.naturalHeight,
                        });
                      }}
                      className="object-cover"
                    />
                  ) : categoryResolutionError ? (
                    <section
                      role="alert"
                      className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center shadow-sm"
                    >
                      <h2 className="text-base font-semibold text-amber-900">
                        Could not resolve the {sectionName} category
                      </h2>
                      <p className="mx-auto mt-2 max-w-xl text-sm text-amber-800">
                        {categoryResolutionError}
                      </p>
                      <Link
                        className="mt-4 inline-block text-sm font-semibold text-[#2867b2] underline"
                        href="/admin/categories"
                      >
                        Review categories
                      </Link>
                    </section>
                  ) : (
                    <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-500">
                      No hero banner uploaded yet
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {bannerDimensions
                    ? `Image dimensions: ${bannerDimensions.width} × ${bannerDimensions.height}px`
                    : "Recommended aspect ratio: 16:6 (wide landscape)"}
                </p>
              </div>
              <div className="flex flex-col justify-center gap-3">
                <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 transition hover:border-[#2867b2] hover:bg-slate-50">
                  <UploadCloud size={18} className="shrink-0 text-[#2867b2]" />
                  <span className="min-w-0 flex-1 truncate">
                    {uploadingBanner
                      ? "Uploading banner..."
                      : bannerImage
                        ? "Choose a different banner image"
                        : "Choose a banner image"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingBanner || savingBanner}
                    onChange={(event) => {
                      void uploadSectionBanner(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                    className="sr-only"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={saveSectionBanner}
                    disabled={
                      !bannerImage ||
                      uploadingBanner ||
                      savingBanner ||
                      bannerImage === sectionCategory.image
                    }
                    className="min-h-11 rounded-lg bg-[#2867b2] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#205796] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingBanner ? "Saving..." : "Save Banner"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBannerImage(sectionCategory.image ?? "");
                      setBannerDimensions(null);
                      setBannerSaved(false);
                      setError("");
                    }}
                    disabled={
                      uploadingBanner ||
                      savingBanner ||
                      bannerImage === (sectionCategory.image ?? "")
                    }
                    className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel Changes
                  </button>
                </div>
                {bannerSaved && (
                  <p role="status" className="text-sm font-medium text-emerald-700">
                    Hero banner saved successfully.
                  </p>
                )}
              </div>
            </div>
          </section>}
          {(sectionName === "Men" || sectionName === "Women") && sectionCategory && (
            <>
              <section className="rounded-xl border border-[#e9e5df] bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-base font-bold text-[#24211e]">{sectionName.toUpperCase()} subcategories</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {menSubcategories.length + 1} department categories. Manage them in Categories.
                    </p>
                  </div>
                  <Link
                    href="/admin/categories"
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Manage categories
                  </Link>
                </div>
                {menSubcategories.length > 0 ? (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {menSubcategories.map((category) => (
                      <li key={category._id} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                        {category.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    Add the predefined {sectionName.toUpperCase()} categories in Categories.
                  </p>
                )}
              </section>
              {isProductFormOpen && (
                <ProductForm
                  key={editing?._id ?? "new"}
                  editing={editing}
                  categories={[sectionCategory, ...menSubcategories]}
                  collections={collections}
                  preselectedCategoryId={sectionCategory._id}
                  onSuccess={() => setRefresh((current) => current + 1)}
                />
              )}
              <ProductTable
                refresh={refresh}
                sectionName={sectionName}
                categoryIds={[sectionCategory._id, ...menSubcategories.map((category) => category._id)]}
                onEdit={(product) => {
                  setEditing(product);
                  setIsProductFormOpen(true);
                }}
              />
            </>
          )}
          {sectionCategory && <section className="rounded-xl border border-[#e9e5df] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-base font-bold text-[#24211e]">
                  {sectionName} Categories Under Hero
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Add circular image tiles like the storefront reference. Each
                  tile opens the category you enter.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSectionTiles((tiles) => [
                    ...tiles,
                    { title: "", image: "", category: "" },
                  ])
                }
                disabled={savingTiles || uploadingTile !== null}
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#e7e2dc] px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-[#f8f6f3] disabled:opacity-60"
              >
                <Plus size={15} aria-hidden="true" />
                Add tile
              </button>
            </div>

            {sectionTiles.length === 0 ? (
              <p className="mt-4 rounded-lg bg-[#faf9f7] px-4 py-6 text-center text-sm text-slate-500">
                No tiles yet. Add a tile for each {sectionName} category you want to
                feature under the hero.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {sectionTiles.map((tile, index) => (
                  <div
                    key={`${index}-${tile.title}`}
                    className="grid gap-3 rounded-lg border border-[#eeeae4] p-3 sm:grid-cols-[88px_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center"
                  >
                    <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full bg-[var(--section-background)] sm:mx-0">
                      {tile.image ? (
                        <Image
                          src={tile.image}
                          alt={tile.title || `${sectionName} category tile preview`}
                          fill
                          unoptimized
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-slate-400">
                          Image preview
                        </div>
                      )}
                    </div>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold text-slate-600">
                        Tile title
                      </span>
                      <input
                        value={tile.title}
                        onChange={(event) =>
                          setSectionTiles((tiles) =>
                            tiles.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, title: event.target.value }
                                : item
                            )
                          )
                        }
                        placeholder="Ready to wear"
                        maxLength={60}
                        className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-[#2867b2]"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold text-slate-600">
                        Category to open
                      </span>
                      <input
                        value={tile.category}
                        onChange={(event) =>
                          setSectionTiles((tiles) =>
                            tiles.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, category: event.target.value }
                                : item
                            )
                          )
                        }
                        placeholder="Ready to wear"
                        maxLength={60}
                        className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-[#2867b2]"
                      />
                    </label>
                    <div className="flex items-center justify-center gap-2 sm:flex-col">
                      <label className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
                        <UploadCloud size={14} aria-hidden="true" />
                        {uploadingTile === index ? "Uploading..." : "Image"}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={savingTiles || uploadingTile !== null}
                          onChange={(event) => {
                            void uploadSectionTile(
                              event.target.files?.[0],
                              index
                            );
                            event.target.value = "";
                          }}
                          className="sr-only"
                        />
                      </label>
                      <button
                        type="button"
                        aria-label={`Remove ${tile.title || "category"} tile`}
                        onClick={() =>
                          setSectionTiles((tiles) =>
                            tiles.filter((_, itemIndex) => itemIndex !== index)
                          )
                        }
                        disabled={savingTiles || uploadingTile !== null}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {sectionTiles.some((tile) => tile.title.trim() && tile.image) && (
              <div className="mt-5 overflow-hidden rounded-lg border border-[#eeeae4] bg-white px-4 py-6 sm:px-6">
                <h3 className="mb-5 text-center text-xl font-medium tracking-wide text-[#171717]">
                  {sectionName.toUpperCase()}
                </h3>
                <div className="grid grid-cols-2 justify-items-center gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
                  {sectionTiles
                    .filter((tile) => tile.title.trim() && tile.image)
                    .map((tile, index) => (
                      <div
                        key={`${index}-${tile.title}`}
                        className="flex w-full max-w-40 flex-col items-center text-center"
                      >
                        <div className="relative aspect-square w-28 overflow-hidden rounded-full bg-[var(--section-background)] sm:w-32">
                          <Image
                            src={tile.image}
                            alt={tile.title}
                            fill
                            unoptimized
                            sizes="128px"
                            className="object-cover"
                          />
                        </div>
                        <span className="mt-3 text-xs font-medium uppercase tracking-wide text-[#171717] sm:text-sm">
                          {tile.title}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={saveSectionTiles}
                disabled={savingTiles || uploadingTile !== null}
                className="min-h-10 rounded-lg bg-[#2867b2] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#205796] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingTiles ? "Saving tiles..." : "Save category tiles"}
              </button>
            </div>
          </section>}
          {sectionName === "Accessories" && sectionCategory && (
            <section className="rounded-xl border border-[#e9e5df] bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-base font-bold text-[#24211e]">
                    Accessories Navigation Menu
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Manage the headings and category names shown when customers open Accessories.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setAccessoriesMenuGroups((groups) => [
                      ...groups,
                      { title: "", categories: [] },
                    ])
                  }
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#e7e2dc] px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-[#f8f6f3]"
                >
                  <Plus size={15} aria-hidden="true" />
                  Add heading
                </button>
              </div>
              {accessoriesMenuGroups.length === 0 ? (
                <p className="mt-4 rounded-lg bg-[#faf9f7] px-4 py-6 text-center text-sm text-slate-500">
                  No menu headings yet. Add a heading such as Jewellery, Hair, or Bags.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {accessoriesMenuGroups.map((group, groupIndex) => (
                    <div
                      key={`accessory-menu-${groupIndex}`}
                      className="rounded-lg border border-[#eeeae4] p-3 sm:p-4"
                    >
                      <div className="flex gap-2">
                        <label className="min-w-0 flex-1">
                          <span className="mb-1 block text-[11px] font-semibold text-slate-600">
                            Menu heading
                          </span>
                          <input
                            value={group.title}
                            maxLength={60}
                            onChange={(event) =>
                              setAccessoriesMenuGroups((groups) =>
                                groups.map((item, index) =>
                                  index === groupIndex
                                    ? { ...item, title: event.target.value }
                                    : item
                                )
                              )
                            }
                            placeholder="Jewellery"
                            className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#2867b2]"
                          />
                        </label>
                        <button
                          type="button"
                          aria-label={`Remove ${group.title || "menu"} heading`}
                          onClick={() =>
                            setAccessoriesMenuGroups((groups) =>
                              groups.filter((_, index) => index !== groupIndex)
                            )
                          }
                          className="mt-6 flex size-10 shrink-0 items-center justify-center rounded-lg border border-red-100 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>

                      <div className="mt-3 space-y-2">
                        {group.categories.map((item, itemIndex) => (
                          <div
                            key={`accessory-menu-item-${groupIndex}-${itemIndex}`}
                            className="grid gap-2 sm:grid-cols-2"
                          >
                            <label>
                              <span className="mb-1 block text-[11px] font-semibold text-slate-600">
                                Display name
                              </span>
                              <input
                                value={item.title}
                                maxLength={60}
                                onChange={(event) =>
                                  setAccessoriesMenuGroups((groups) =>
                                    groups.map((currentGroup, currentGroupIndex) =>
                                      currentGroupIndex === groupIndex
                                        ? {
                                            ...currentGroup,
                                            categories: currentGroup.categories.map(
                                              (currentItem, currentItemIndex) =>
                                                currentItemIndex === itemIndex
                                                  ? { ...currentItem, title: event.target.value }
                                                  : currentItem
                                            ),
                                          }
                                        : currentGroup
                                    )
                                  )
                                }
                                placeholder="Bracelet"
                                className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#2867b2]"
                              />
                            </label>
                            <div className="flex items-end gap-2">
                              <label className="min-w-0 flex-1">
                                <span className="mb-1 block text-[11px] font-semibold text-slate-600">
                                  Category to open
                                </span>
                                <select
                                  value={item.category}
                                  onChange={(event) =>
                                    setAccessoriesMenuGroups((groups) =>
                                      groups.map((currentGroup, currentGroupIndex) =>
                                        currentGroupIndex === groupIndex
                                          ? {
                                              ...currentGroup,
                                              categories: currentGroup.categories.map(
                                                (currentItem, currentItemIndex) =>
                                                  currentItemIndex === itemIndex
                                                    ? {
                                                        ...currentItem,
                                                        category: event.target.value,
                                                      }
                                                    : currentItem
                                              ),
                                            }
                                          : currentGroup
                                      )
                                    )
                                  }
                                  className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#2867b2]"
                                >
                                  <option value="">Select category</option>
                                  {allCategories
                                    .filter((category) => category._id !== sectionCategory._id)
                                    .map((category) => (
                                      <option key={category._id} value={category.name}>
                                        {category.name}
                                      </option>
                                    ))}
                                </select>
                              </label>
                              <button
                                type="button"
                                aria-label={`Remove ${item.title || "category"}`}
                                onClick={() =>
                                  setAccessoriesMenuGroups((groups) =>
                                    groups.map((currentGroup, currentGroupIndex) =>
                                      currentGroupIndex === groupIndex
                                        ? {
                                            ...currentGroup,
                                            categories: currentGroup.categories.filter(
                                              (_, currentItemIndex) =>
                                                currentItemIndex !== itemIndex
                                            ),
                                          }
                                        : currentGroup
                                    )
                                  )
                                }
                                className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-red-100 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={16} aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setAccessoriesMenuGroups((groups) =>
                            groups.map((item, index) =>
                              index === groupIndex
                                ? {
                                    ...item,
                                    categories: [
                                      ...item.categories,
                                      { title: "", category: "" },
                                    ],
                                  }
                                : item
                            )
                          )
                        }
                        className="mt-3 text-xs font-semibold text-[#2867b2] hover:underline"
                      >
                        + Add category
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={saveAccessoriesMenu}
                  disabled={savingTiles}
                  className="min-h-10 rounded-lg bg-[#2867b2] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#205796] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingTiles ? "Saving menu..." : "Save Accessories menu"}
                </button>
              </div>
            </section>
          )}
          {sectionName !== "Men" && sectionName !== "Women" && <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setIsProductFormOpen((open) => !open);
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#2867b2] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#205796]"
            >
              <Plus size={16} aria-hidden="true" />
              {isProductFormOpen ? "Close Product Form" : "New Product"}
            </button>
          </div>}
          {sectionName !== "Men" && sectionName !== "Women" && isProductFormOpen && (
            <ProductForm
              key={editing?._id ?? "new"}
              editing={editing}
              categories={
                sectionName === "New Arrivals"
                  ? allCategories
                  : SECTION_ROUTE_GROUPS[sectionName]
                    ? allCategories.filter(
                        (category) =>
                          category._id === sectionCategory?._id ||
                          category.parentCategory === sectionCategory?._id ||
                          category.routeGroup === SECTION_ROUTE_GROUPS[sectionName]
                      )
                    : sectionCategory
                      ? [sectionCategory]
                      : []
              }
              collections={collections}
              forceNewArrival={sectionName === "New Arrivals"}
              preselectedCategoryId={
                sectionName === "New Arrivals" ? "" : sectionCategory?._id ?? ""
              }
              onSuccess={() => {
                setRefresh((current) => current + 1);
              }}
            />
          )}
          {sectionName !== "Men" && sectionName !== "Women" && <ProductTable
            refresh={refresh}
            sectionName={sectionName}
            categoryId={
              sectionName === "New Arrivals" ||
              Boolean(SECTION_ROUTE_GROUPS[sectionName])
                ? undefined
                : sectionCategory?._id
            }
            newArrivalOnly={sectionName === "New Arrivals"}
            categoryIds={
              SECTION_ROUTE_GROUPS[sectionName]
                ? allCategories
                    .filter(
                      (category) =>
                        category._id === sectionCategory?._id ||
                        category.parentCategory === sectionCategory?._id ||
                        category.routeGroup === SECTION_ROUTE_GROUPS[sectionName]
                    )
                    .map((category) => category._id)
                : undefined
            }
            onEdit={(product) => {
              setEditing(product);
              setIsProductFormOpen(true);
            }}
          />}
        </>
      ) : (
        <section className="rounded-xl border border-[#e9e5df] bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-[#24211e]">
            Set up the {sectionName} section
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
            Create the {sectionName} category once. Products added here will then appear
            under {sectionName} in the storefront navigation.
          </p>
          <button
            type="button"
            onClick={createSectionCategory}
            disabled={creatingCategory}
            className="mt-5 rounded-lg bg-[#2867b2] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#205796] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creatingCategory ? "Setting up..." : `Set up ${sectionName} category`}
          </button>
          <p className="mt-4 text-xs text-slate-500">
            Or add it from{" "}
            <Link className="font-semibold text-[#2867b2] underline" href="/admin/categories">
              Categories
            </Link>
            .
          </p>
        </section>
      )}
    </div>
  );
}
