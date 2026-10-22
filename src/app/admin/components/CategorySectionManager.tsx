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
  image?: string;
  sectionTiles?: SectionTile[];
}

interface SectionTile {
  title: string;
  image: string;
  category: string;
}

interface Collection {
  _id: string;
  title: string;
}

export default function CategorySectionManager({
  sectionName,
}: {
  sectionName: "Girls" | "Women";
}) {
  const [sectionCategory, setSectionCategory] = useState<Category | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [setupRevision, setSetupRevision] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [bannerImage, setBannerImage] = useState("");
  const [sectionTiles, setSectionTiles] = useState<SectionTile[]>([]);
  const [uploadingTile, setUploadingTile] = useState<number | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);
  const [savingTiles, setSavingTiles] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([
      fetch("/api/categories", { cache: "no-store" }),
      fetch("/api/collections", { cache: "no-store" }),
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
        const sectionPattern =
          sectionName === "Girls" ? /\bgirls?\b/ : /\bwomen\b|womens/;
        const sectionCategories = categories.filter((item: Category) =>
          sectionPattern.test(
            `${item.name?.trim().toLowerCase() ?? ""} ${item.slug?.trim().toLowerCase() ?? ""}`
          )
        );
        const category =
          sectionCategories.find(
            (item: Category) => (item.sectionTiles?.length ?? 0) > 0
          ) ??
          sectionCategories.find(
            (item: Category) =>
              sectionName === "Girls"
                ? /girls?\s+wear/.test(item.name?.trim().toLowerCase() ?? "") ||
                  /girls?-wear/.test(item.slug?.trim().toLowerCase() ?? "")
                : /women('?s)?\s+wear|womens?\s+wear/.test(
                    item.name?.trim().toLowerCase() ?? ""
                  ) || /women('?s)?-wear|womens?-wear/.test(
                    item.slug?.trim().toLowerCase() ?? ""
                  )
          ) ??
          sectionCategories[0] ??
          null;
        setSectionCategory(category);
        setBannerImage(category?.image ?? "");
        setSectionTiles(category?.sectionTiles ?? []);
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
      setBannerImage(data.image ?? "");
      setSectionTiles(data.sectionTiles ?? []);
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

      setSectionCategory(data);
      setBannerImage(data.image ?? "");
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

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[#e9e5df] bg-white p-5 shadow-sm">
        <p className="text-xs font-medium text-slate-500">Store sections / {sectionName}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#24211e]">
          {sectionName} Products
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Add and manage products shown in the {sectionName} section of your store.
        </p>
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
        <div className="rounded-xl border border-[#e9e5df] bg-white p-8 text-center text-sm text-slate-500">
          Loading {sectionName} products...
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
      ) : sectionCategory ? (
        <>
          <section className="rounded-xl border border-[#e9e5df] bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4">
              <h2 className="text-base font-bold text-[#24211e]">
                {sectionName} Hero Banner
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                This image appears in the {sectionName} storefront hero section.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-end">
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
              <button
                type="button"
                onClick={saveSectionBanner}
                disabled={!bannerImage || uploadingBanner || savingBanner}
                className="min-h-12 rounded-lg bg-[#2867b2] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#205796] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingBanner ? "Saving banner..." : "Save hero banner"}
              </button>
            </div>
            {bannerImage && (
              <div className="relative mt-4 h-40 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 sm:h-52">
                <Image
                  src={bannerImage}
                  alt={`${sectionName} hero banner preview`}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 100vw, 800px"
                  className="object-cover"
                />
              </div>
            )}
          </section>
          <section className="rounded-xl border border-[#e9e5df] bg-white p-4 shadow-sm sm:p-5">
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
                    <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full bg-[#f5f2ed] sm:mx-0">
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
                        <div className="relative aspect-square w-28 overflow-hidden rounded-full bg-[#f5f2ed] sm:w-32">
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
          </section>
          <ProductForm
            editing={editing}
            categories={[sectionCategory]}
            collections={collections}
            onSuccess={() => {
              setEditing(null);
              setRefresh((current) => current + 1);
            }}
          />
          <ProductTable
            refresh={refresh}
            categoryId={sectionCategory._id}
            onEdit={setEditing}
          />
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
