"use client";

import { useState } from "react";
import Image from "next/image";
import slugify from "slugify";
import { X, Upload, Loader2, FolderPlus, Edit3 } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { prepareImageForUpload } from "@/lib/image-upload";
import CollectionProductManager from "./CollectionProductManager";

interface Collection {
  _id?: string;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  image: string;
  status: boolean;
}

interface Props {
  editing: Collection | null;
  onSuccess: () => void;
}

const initialState: Collection = {
  title: "",
  slug: "",
  subtitle: "",
  description: "",
  buttonText: "",
  buttonLink: "",
  image: "",
  status: true,
};

export default function CollectionForm({ editing, onSuccess }: Props) {
  const [form, setForm] = useState<Collection>(() =>
    editing ? { ...initialState, ...editing } : initialState
  );
  const [editingId, setEditingId] = useState(editing?._id ?? "");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Handle generalized text elements, check toggles, and sync safe URLs via slugify
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    setForm((prev) => {
      const updated = {
        ...prev,
        [name]:
          type === "checkbox"
            ? (e.target as HTMLInputElement).checked
            : value,
      };

      if (name === "title") {
        updated.slug = slugify(value, {
          lower: true,
          strict: true,
        });
      }

      return updated;
    });
  };

  // Image Upload Handler
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();

    try {
      formData.append("file", await prepareImageForUpload(file));
      const res = await adminFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.status === 401) return;
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || data.message || `Upload failed (${res.status}).`);
      }

      const data = await res.json();
      
      if (data.url) {
        setForm((prev) => ({
          ...prev,
          image: data.url,
        }));
      } else {
        throw new Error("URL not found in response");
      }
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const removeImage = () => {
    setForm((prev) => ({ ...prev, image: "" }));
  };

  // Submit Handler
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title || !form.slug || !form.subtitle || !form.description) {
      alert("Please fill all required fields (Title, Slug, Subtitle, and Description).");
      return;
    }

    setLoading(true);

    const url = editingId ? `/api/collections/${editingId}` : "/api/collections";
    const method = editingId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error("Something went wrong.");

      setForm(initialState);
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("Failed to save collection. Please check your console API logs.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {editingId ? (
              <>
                <Edit3 size={20} className="text-[var(--brand-primary)]" /> Edit Collection
              </>
            ) : (
              <>
                <FolderPlus size={20} className="text-[var(--brand-primary)]" /> Add New Collection
              </>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure storefront hero banners and home feature items.
          </p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${editingId ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
          {editingId ? "Update Mode" : "Creation Mode"}
        </span>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        
        {/* Title, Slug & Subtitle Layout Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Collection Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g., Summer Collection"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Slug
            </label>
            <input
              type="text"
              name="slug"
              value={form.slug}
              readOnly
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-600 focus:outline-none cursor-not-allowed select-all"
            />
            {/* Real-time Dynamic Path Preview Widget */}
            {form.slug && (
              <p className="mt-2 text-xs text-slate-500">
                URL:
                <span className="ml-1 font-semibold text-[var(--brand-primary)]">
                  /collections/{form.slug}
                </span>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Subtitle / Hook <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="subtitle"
              value={form.subtitle}
              onChange={handleChange}
              placeholder="e.g., Winter Essentials"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all"
              required
            />
          </div>
        </div>

        {/* Buttons Setup */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Button Label</label>
            <input
              type="text"
              name="buttonText"
              value={form.buttonText}
              onChange={handleChange}
              placeholder="e.g., Shop Collection"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Button Redirect Path</label>
            <input
              type="text"
              name="buttonLink"
              value={form.buttonLink}
              onChange={handleChange}
              placeholder="e.g., /shop/summer-collection"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all"
            />
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">
            Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={4}
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the fabric traits, aesthetic style themes..."
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all resize-none"
            required
          />
        </div>

        {/* Image Upload Canvas */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700">
            Collection Canvas Banner <span className="text-xs font-normal text-slate-400">(optional)</span>
          </label>

          {!form.image ? (
            <label className={`flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 hover:border-[var(--brand-primary)] transition-all cursor-pointer group ${uploading ? 'pointer-events-none opacity-60' : ''}`}>
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 text-[var(--brand-primary)] animate-spin" />
                  <p className="text-sm text-slate-600 font-medium">Processing assets...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload size={28} className="text-slate-400 mb-2 group-hover:text-[var(--brand-primary)] group-hover:scale-105 transition-all" />
                  <p className="mb-1 text-sm text-slate-600 font-medium">Click to upload banner</p>
                  <p className="text-xs text-slate-400">Optimal aspect ratio 16:9 (Max 4 MB)</p>
                </div>
              )}
              <input
                hidden
                type="file"
                name="image-uploader"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </label>
          ) : (
            <div className="relative h-64 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-900 group">
              <Image
                src={form.image}
                alt="Collection Preview"
                fill
                className="object-cover opacity-90 transition-transform duration-300 group-hover:scale-[1.01]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute right-4 top-4 p-2 rounded-lg bg-white/90 text-slate-700 backdrop-blur-sm shadow-md hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Toggle Controls */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-slate-800">Publish Status</span>
            <span className="text-xs text-slate-500">Enable visibility on the client live storefront.</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              name="status"
              checked={form.status}
              onChange={handleChange}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--brand-primary)]"></div>
          </label>
        </div>

        {/* Sticky Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              setForm(initialState);
              setEditingId("");
            }}
            disabled={loading || uploading}
            className="px-4 py-2.5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            Reset Form
          </button>
          <button
            type="submit"
            disabled={loading || uploading}
            className="px-5 py-2.5 flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--brand-primary)] text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Saving Records..." : editingId ? "Update Collection" : "Publish Collection"}
          </button>
        </div>

      </form>
    </div>
    {editingId && <CollectionProductManager key={editingId} collectionId={editingId} />}
    </div>
  );
}