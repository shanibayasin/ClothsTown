"use client";

import { useState } from "react";
import Image from "next/image";
import { adminFetch } from "@/lib/admin-fetch";

interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
  status: boolean;
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
  status: true,
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
          status: editing.status,
        }
      : initialState
  );

  const [loading, setLoading] = useState(false);

  const [uploading, setUploading] = useState(false);

  function createSlug(text: string) {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");
  }

  async function uploadImage(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await adminFetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      if (res.status === 401) return;
      if (!res.ok) throw new Error(`Image upload failed (${res.status}).`);

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!data?.url) {
        throw new Error("The image upload response did not include an image URL.");
      }

      setForm((prev) => ({
        ...prev,
        image: data.url,
      }));
    } catch (error) {
      console.error("Category image upload failed:", error);
      alert(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!form.name.trim()) {
      return alert("Category name is required.");
    }

    if (!editing && !form.image) {
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

          <label className="mb-2 block text-sm font-semibold">
            Category Image
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={uploadImage}
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
              className="rounded-lg border object-cover"
            />

          </div>

        )}

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
          disabled={loading}
          className="h-11 w-full rounded-lg bg-[#6f1d46] font-medium text-white transition hover:bg-[#581739]"
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