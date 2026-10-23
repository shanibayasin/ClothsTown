"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { adminFetch } from "@/lib/admin-fetch";
import { prepareImageForUpload } from "@/lib/image-upload";

interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
  bannerImage?: string;
  bannerTitle?: string;
  bannerDescription?: string;
  bannerPosition?: "left" | "center" | "right";
  status: boolean;
  parentCategory?: string | null;
}

interface Props {
  editing: Category | null;
  onSuccess: () => void;
  onCancelEdit: () => void;
}

const initialState = {
  name: "",
  slug: "",
  image: "",
  bannerImage: "",
  bannerTitle: "",
  bannerDescription: "",
  bannerPosition: "left" as const,
  status: true,
  parentCategory: "",
};

export default function CategoryForm({
  editing,
  onSuccess,
  onCancelEdit,
}: Props) {
  const [form, setForm] = useState(() =>
    editing
      ? {
          name: editing.name || "",
          slug: editing.slug || "",
          image: editing.image || "",
          bannerImage: editing.bannerImage || "",
          bannerTitle: editing.bannerTitle || "",
          bannerDescription: editing.bannerDescription || "",
          bannerPosition: editing.bannerPosition || "left",
          status: editing.status,
          parentCategory:
            typeof editing.parentCategory === "string" ? editing.parentCategory : "",
        }
      : initialState
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLoadError, setCategoryLoadError] = useState("");

  const [loading, setLoading] = useState(false);

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/categories", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Could not load parent categories (${response.status}).`);
        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw new Error("Category list response was invalid.");
        if (active) {
          setCategories(data as Category[]);
          setCategoryLoadError("");
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to load category parent options:", error);
        if (active) setCategoryLoadError("Could not load parent categories.");
      });
    return () => {
      active = false;
    };
  }, []);

  function createSlug(text: string) {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");
  }

  async function uploadImage(
    e: React.ChangeEvent<HTMLInputElement>,
    field: "image" | "bannerImage"
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", await prepareImageForUpload(file));

      const res = await adminFetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      if (res.status === 401) return;
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || data.message || `Image upload failed (${res.status}).`);
      }

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!data?.url) {
        throw new Error("The image upload response did not include an image URL.");
      }

      setForm((prev) => ({ ...prev, [field]: data.url }));
    } catch (error) {
      console.error(`Category ${field} upload failed:`, error);
      alert(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!form.name.trim()) {
      return alert("Category name is required.");
    }
    if (form.bannerTitle.trim().length > 160) {
      return alert("Banner title must be 160 characters or fewer.");
    }
    if (form.bannerDescription.trim().length > 500) {
      return alert("Banner description must be 500 characters or fewer.");
    }

    if (!editing && !form.image && !form.parentCategory) {
      return alert("Please upload category image.");
    }

    setLoading(true);

    try {
      const url = editing
        ? `/api/categories/${editing._id}`
        : "/api/categories";

      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        throw new Error(data?.message || "Failed to save category");
      }

      setForm(initialState);
      onSuccess();
    } catch (error) {
      console.error("Failed to save category:", error);
      alert(error instanceof Error ? error.message : "Failed to save category.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow">

      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-[#6f1d46]">
          {editing ? "Edit Category" : "Add Category"}
        </h2>
        {editing && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cancel edit
          </button>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >

        {/* Name */}

        <div>

          <label className="mb-2 block text-sm font-semibold">
            Category Name
          </label>

          <input
            type="text"
            placeholder="Enter category name"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
                slug: createSlug(e.target.value),
              })
            }
            className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm outline-none transition focus:border-[#6f1d46]"
          />

        </div>

        {/* Image */}

        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor="parentCategory">
            Parent department
          </label>
          <select
            id="parentCategory"
            value={form.parentCategory}
            onChange={(event) =>
              setForm({ ...form, parentCategory: event.target.value })
            }
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none transition focus:border-[#6f1d46]"
          >
            <option value="">Top-level category</option>
            {categories
              .filter(
                (category) =>
                  !category.parentCategory && category._id !== editing?._id
              )
              .map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
          </select>
          {categoryLoadError && (
            <p role="alert" className="mt-1 text-xs text-red-700">{categoryLoadError}</p>
          )}
          {form.parentCategory && (
            <p className="mt-1 text-xs text-slate-500">
              Subcategories can be saved without an image; the storefront uses a neutral fallback.
            </p>
          )}
        </div>

        <div>

          <label className="mb-2 block text-sm font-semibold">
            Category Image
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(event) => void uploadImage(event, "image")}
            className="block w-full rounded-lg border border-gray-300 p-2 text-sm"
          />

          {uploading && (
            <p className="mt-2 text-sm text-blue-600">
              Uploading image...
            </p>
          )}

        </div>

        {/* Preview */}

        {form.image && (

          <div>

            <Image
              src={form.image}
              alt="Preview"
              width={140}
              height={140}
              unoptimized
              className="aspect-square rounded-lg border object-cover"
            />

          </div>

        )}

        <section className="space-y-4 rounded-xl border border-slate-200 p-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Category Banner</h3>
            <p className="mt-1 text-xs text-slate-500">
              Optional banner for this category&apos;s product listing page. It does not change the category thumbnail.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="category-banner-upload">
              Banner image
            </label>
            <input
              id="category-banner-upload"
              type="file"
              accept="image/*"
              onChange={(event) => void uploadImage(event, "bannerImage")}
              className="block w-full rounded-lg border border-gray-300 p-2 text-sm"
            />
            {uploading && (
              <p className="mt-2 text-sm text-blue-600">Uploading image...</p>
            )}
          </div>

          {form.bannerImage ? (
            <div>
              <div className="relative aspect-[3/1] w-full overflow-hidden rounded-lg border bg-slate-100">
                <Image
                  src={form.bannerImage}
                  alt="Category banner preview"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <div className="mt-2 flex gap-3">
                <label
                  htmlFor="category-banner-upload"
                  className="cursor-pointer text-xs font-semibold text-[#6f1d46] hover:underline"
                >
                  Replace image
                </label>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, bannerImage: "" }))}
                  className="text-xs font-semibold text-red-700 hover:underline"
                >
                  Remove image
                </button>
              </div>
            </div>
          ) : (
            <div className="flex aspect-[3/1] items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-500">
              No banner uploaded
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-semibold" htmlFor="bannerTitle">
              Banner title <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="bannerTitle"
              type="text"
              maxLength={160}
              value={form.bannerTitle}
              onChange={(event) => setForm((prev) => ({ ...prev, bannerTitle: event.target.value }))}
              className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-[#6f1d46]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold" htmlFor="bannerDescription">
              Banner description <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="bannerDescription"
              maxLength={500}
              rows={3}
              value={form.bannerDescription}
              onChange={(event) => setForm((prev) => ({ ...prev, bannerDescription: event.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#6f1d46]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold" htmlFor="bannerPosition">
              Banner text position
            </label>
            <select
              id="bannerPosition"
              value={form.bannerPosition}
              onChange={(event) => {
                const position = event.target.value;
                if (position === "left" || position === "center" || position === "right") {
                  setForm((prev) => ({ ...prev, bannerPosition: position }));
                }
              }}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none focus:border-[#6f1d46]"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </section>

        {/* Status */}

        <div>

          <label className="flex items-center gap-3">

            <input
              type="checkbox"
              checked={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.checked,
                })
              }
            />

            <span className="text-sm">
              Active Category
            </span>

          </label>

        </div>

        {/* Button */}

        <button
          type="submit"
          disabled={loading || uploading}
          className="h-11 w-full rounded-lg bg-[#6f1d46] font-medium text-white transition hover:bg-[#581739] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Saving..."
            : editing
            ? "Update Category"
            : "Save Category"}
        </button>

      </form>

    </div>
  );
}