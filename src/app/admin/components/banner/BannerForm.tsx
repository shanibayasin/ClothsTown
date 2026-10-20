"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  FolderPlus,
  Edit3,
  Loader2,
  Upload,
  X,
} from "lucide-react";

interface Banner {
  _id?: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  image: string;
  status: boolean;
}

interface Props {
  editing: Banner | null;
  onClose?: () => void; // Standard close tracking overlay feature validation
  onSuccess: () => void;
}

const initialState: Banner = {
  title: "",
  subtitle: "",
  description: "",
  buttonText: "Shop Now",
  buttonLink: "/shop",
  image: "",
  status: true,
};

export default function BannerForm({
  editing,
  onClose,
  onSuccess,
}: Props) {
  const [form, setForm] = useState<Banner>(initialState);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm(editing);
      setEditingId(editing._id || "");
    } else {
      setForm(initialState);
      setEditingId("");
    }
  }, [editing]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  }

  async function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Image upload failed");
      const data = await res.json();

      setForm((prev) => ({
        ...prev,
        image: data.url,
      }));
    } catch (err) {
      console.error("Image uploading context error:", err);
    } finally {
      setUploading(false);
    }
  }

  function removeImage() {
    setForm((prev) => ({
      ...prev,
      image: "",
    }));
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();
    setLoading(true);

    const url = editingId
      ? `/api/banner/${editingId}`
      : "/api/banner";

    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Form action execution failed");

      setForm(initialState);
      setEditingId("");
      onSuccess();
    } catch (err) {
      console.error("Banner save operation error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
            {editingId ? (
              <>
                <Edit3 size={20} className="text-primary" />
                Edit Hero Banner
              </>
            ) : (
              <>
                <FolderPlus size={20} className="text-primary" />
                Add Hero Banner
              </>
            )}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Manage homepage hero section.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              editingId
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {editingId ? "Update Mode" : "Create Mode"}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Banner Title
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary transition text-sm"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Subtitle
            </label>
            <input
              name="subtitle"
              value={form.subtitle}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary transition text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            rows={3}
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary transition text-sm"
            required
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Button Text
            </label>
            <input
              name="buttonText"
              value={form.buttonText}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary transition text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Button Link
            </label>
            <input
              name="buttonLink"
              value={form.buttonLink}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary transition text-sm"
            />
          </div>
        </div>

        {/* Image Upload Area */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700">
            Hero Banner Image
          </label>

          {!form.image ? (
            <label
              className={`flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-primary ${
                uploading ? "pointer-events-none opacity-60" : ""
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin text-primary" size={28} />
                  <p className="mt-3 text-sm text-slate-500 font-medium">Uploading visual banner assets...</p>
                </>
              ) : (
                <>
                  <Upload size={26} className="text-slate-400" />
                  <p className="mt-2 text-sm font-semibold text-slate-600">Click to Upload Hero Banner</p>
                  <p className="text-xs text-slate-400 mt-0.5">Recommended 1920 × 900 px</p>
                </>
              )}
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
          ) : (
            <div className="relative h-60 overflow-hidden rounded-xl border border-slate-200 shadow-inner">
              <Image
                src={form.image}
                alt="Banner visual template preview"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute right-3 top-3 rounded-xl bg-white/90 p-2 shadow-md hover:bg-white text-slate-600 hover:text-red-600 backdrop-blur-sm transition"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Publish Toggler Action Row */}
        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Publish Banner</h3>
            <p className="text-xs text-slate-500">Show this banner dynamically inside the homepage interface view</p>
          </div>

          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              name="status"
              checked={form.status}
              onChange={handleChange}
              className="peer sr-only"
            />
            <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full shadow-inner"></div>
          </label>
        </div>

        {/* Submission Panel Buttons */}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={() => {
              setForm(initialState);
              setEditingId("");
              if (onClose) onClose();
            }}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading || uploading}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary-dark disabled:opacity-50 transition"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {editingId ? "Update Banner" : "Save Banner"}
          </button>
        </div>
      </form>
    </div>
  );
}