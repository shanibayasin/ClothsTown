"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { adminFetch } from "@/lib/admin-fetch";

interface Category {
  _id: string;
  name: string;
}

interface Collection {
  _id: string;
  title: string;
}

interface ProductFormProps {
  editing?: any | null;
  categories: Category[];
  collections: Collection[];
  onSuccess: () => void;
}

interface ProductFormState {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: string;
  discountPrice: string;
  stock: string;
  sku: string;
  category: string;
  collection: string;
  images: string[];
  sizes: string[];
  colors: string[];
  featured: boolean;
  newArrival: boolean;
  status: boolean;
}

const initialState: ProductFormState = {
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  price: "",
  discountPrice: "",
  stock: "",
  sku: "",
  category: "",
  collection: "",
  images: [],
  sizes: [],
  colors: [],
  featured: false,
  newArrival: false,
  status: true,
};

const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];
const colorOptions = ["Black", "White", "Brown", "Beige", "Navy", "Grey", "Olive", "Maroon"];

function createSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
}

function createSKU(name: string) {
  const code = name
    .split(" ")
    .slice(0, 3)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();

  return `VEL-${code}-${Math.floor(100 + Math.random() * 900)}`;
}

export default function ProductForm({
  editing,
  categories,
  collections,
  onSuccess,
}: ProductFormProps) {
  const [form, setForm] = useState<ProductFormState>(initialState);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadedCategories, setLoadedCategories] = useState<Category[]>([]);
  const [loadedCollections, setLoadedCollections] = useState<Collection[]>([]);

  const resolvedCategories = categories.length > 0 ? categories : loadedCategories;
  const resolvedCollections = collections.length > 0 ? collections : loadedCollections;

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      try {
        const [catRes, colRes] = await Promise.all([
          fetch("/api/categories", { cache: "no-store" }),
          fetch("/api/collections", { cache: "no-store" }),
        ]);

        const [catData, colData] = await Promise.all([
          catRes.json(),
          colRes.json(),
        ]);

        const normalizedCategories = Array.isArray(catData)
          ? catData.filter(
              (item: any) => item && item._id && item.name && item.status !== false
            )
          : [];

        const normalizedCollections = Array.isArray(colData)
          ? colData.filter(
              (item: any) => item && item._id && item.title && item.status !== false
            )
          : [];

        if (!isMounted) return;

        setLoadedCategories(normalizedCategories);
        setLoadedCollections(normalizedCollections);
      } catch (error) {
        console.error("Failed to load form options:", error);
      }
    }

    if (categories.length === 0 || collections.length === 0) {
      loadOptions();
    }

    return () => {
      isMounted = false;
    };
  }, [categories.length, collections.length]);

  useEffect(() => {
    if (editing) {
      setForm({
        ...editing,
        category: editing.category?._id || editing.category || "",
        collection: editing.collection?._id || editing.collection || "",
        price: String(editing.price || ""),
        discountPrice: String(editing.discountPrice || ""),
        stock: String(editing.stock || ""),
        images: editing.images || [],
        sizes: editing.sizes || [],
        colors: editing.colors || [],
      });
    } else {
      setForm(initialState);
    }
  }, [editing]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const toggleArray = (key: "sizes" | "colors", value: string) => {
    setForm((prev) => {
      const arr = prev[key];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter((i) => i !== value) : [...arr, value],
      };
    });
  };

  async function uploadImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploaded: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} is larger than 5MB.`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        const res = await adminFetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          if (res.status === 401) return;
          alert(data.message || `Upload failed (${res.status}).`);
          continue;
        }
        uploaded.push(data.url);
      }

      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...uploaded],
      }));
    } catch (error) {
      console.error(error);
      alert("Image upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeImage(image: string) {
    if (!confirm("Remove this image?")) return;
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img !== image),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim() || form.name.trim().length < 3) {
      return alert("Product name must be at least 3 characters.");
    }
    if (!form.category) return alert("Please select a category.");
    if (!form.collection) return alert("Please select a collection.");
    if (!form.price || Number(form.price) <= 0) return alert("Valid price is required.");
    if (Number(form.discountPrice) > Number(form.price)) {
      return alert("Discount price cannot be greater than product price.");
    }
    if (Number(form.stock) < 0) return alert("Stock cannot be negative.");
    if (form.images.length === 0) return alert("Please upload at least one image.");
    if (form.sizes.length === 0) return alert("Select at least one size.");
    if (form.colors.length === 0) return alert("Select at least one color.");

    setSaving(true);

    const payload = {
      ...form,
      sku: form.sku.trim() || createSKU(form.name),
      price: Number(form.price),
      discountPrice: Number(form.discountPrice || 0),
      stock: Number(form.stock),
    };

    try {
      const url = editing ? `/api/products/${editing._id}` : "/api/products";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) return alert(data.message || "Failed to save product.");

      alert(editing ? "Product updated successfully." : "Product added successfully.");
      if (!editing) setForm(initialState);
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 sm:space-y-8">
      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 shadow-[0_4px_24px_rgba(15,23,42,0.04)] sm:space-y-6 sm:p-6 lg:p-8">
        <div className="flex flex-col justify-between gap-4 rounded-2xl bg-[#142536] px-4 py-5 text-white sm:flex-row sm:items-center sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">Product management</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">
              {editing ? "Edit Product Details" : "Add New Product"}
            </h2>
            <p className="mt-1 text-xs text-slate-300 sm:text-sm">
              Add product details, pricing, inventory, and images.
            </p>
          </div>
          <span className="w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-slate-100">
            {editing ? "Edit mode" : "New listing"}
          </span>
        </div>

        {/* 📝 BASIC INFORMATION SECTION */}
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-[#142536] sm:text-lg">Basic Information</h3>
            <p className="mt-1 text-xs text-slate-500">Product name and customer-facing descriptions</p>
          </div>
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700 sm:text-sm">Product Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm({
                    ...form,
                    name: value,
                    slug: createSlug(value),
                    sku: form.sku || createSKU(value),
                  });
                }}
                placeholder="e.g., Classic Winter Coat"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 sm:text-sm"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700 sm:text-sm">Slug URL Path</label>
              <input
                type="text"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="classic-winter-coat"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-500 outline-none sm:text-sm"
                readOnly
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold text-slate-700 sm:text-sm">Short Description</label>
              <input
                type="text"
                name="shortDescription"
                value={form.shortDescription}
                onChange={handleChange}
                maxLength={160}
                placeholder="Brief line about the fabric or cut..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 sm:text-sm"
              />
              <div className="mt-2 text-right text-xs text-gray-400">
                {form.shortDescription.length}/160 Characters
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold text-slate-700 sm:text-sm">Detailed Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                maxLength={1000}
                rows={4}
                placeholder="Describe the product material, design, care instructions..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 sm:text-sm"
              />
              <div className="mt-2 text-right text-xs text-gray-400">
                {form.description.length}/1000 Characters
              </div>
            </div>
          </div>
        </div>

        {/* 📂 ORGANIZATION SECTION */}
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-[#142536] sm:text-lg">Organization</h3>
            <p className="mt-1 text-xs text-slate-500">Choose where this product appears in your store</p>
          </div>
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700 sm:text-sm">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 sm:text-sm"
              >
                <option value="">Select Category</option>
                {resolvedCategories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700 sm:text-sm">Collection</label>
              <select
                name="collection"
                value={form.collection}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 sm:text-sm"
              >
                <option value="">Select Collection</option>
                {resolvedCollections.map((col) => (
                  <option key={col._id} value={col._id}>{col.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 💰 PRICING & INVENTORY SECTION */}
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-[#142536] sm:text-lg">Pricing & Inventory</h3>
            <p className="mt-1 text-xs text-slate-500">Set your price, discount, available quantity, and SKU</p>
          </div>
          <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700 sm:text-sm">Price (Rs.)</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="8500"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 sm:text-sm"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700 sm:text-sm">Discount Price (Rs.)</label>
              <input
                type="number"
                name="discountPrice"
                value={form.discountPrice}
                onChange={handleChange}
                placeholder="7999"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 sm:text-sm"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700 sm:text-sm">Stock Inventory</label>
              <input
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                placeholder="50"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 sm:text-sm"
              />
            </div>
            <div className="md:col-span-3">
              <label className="mb-2 block text-xs font-semibold text-slate-700 sm:text-sm">Product SKU</label>
              <input
                type="text"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder="VEL-AB-123"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* 📏 SIZES SECTION */}
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-[#142536] sm:text-lg">Available Sizes</h3>
            <p className="mt-1 text-xs text-slate-500">Select all sizes available for this product</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {sizeOptions.map((sz) => (
              <button
                type="button"
                key={sz}
                onClick={() => toggleArray("sizes", sz)}
                className={`rounded-xl px-5 py-2.5 text-xs font-bold transition ${
                  form.sizes.includes(sz)
                    ? "bg-primary text-white shadow-md shadow-primary/10"
                    : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* 🎨 COLOR SECTION */}
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-[#142536] sm:text-lg">Available Colors</h3>
            <p className="mt-1 text-xs text-slate-500">Choose the color options customers can select</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {colorOptions.map((clr) => (
              <button
                type="button"
                key={clr}
                onClick={() => toggleArray("colors", clr)}
                className={`rounded-xl px-5 py-2.5 text-xs font-medium transition ${
                  form.colors.includes(clr)
                    ? "bg-heading text-white shadow-md"
                    : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {clr}
              </button>
            ))}
          </div>
        </div>

        {/* MEDIA MANAGEMENT */}
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-[#142536] sm:text-lg">Product Images</h3>
            <p className="mt-1 text-xs text-slate-500">Upload clear product photos; the first image is the primary image</p>
          </div>
          <label
            htmlFor="images"
            className={`flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-4 py-8 text-center transition hover:border-primary hover:bg-[#fff8fa] sm:min-h-48 ${uploading ? "pointer-events-none opacity-60" : ""}`}
          >
            <span className="mb-3 flex size-12 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">📷</span>
            <h4 className="text-sm font-semibold text-[#142536] sm:text-base">{uploading ? "Uploading images..." : "Upload product images"}</h4>
            <p className="mt-1 text-xs text-slate-500">JPG, PNG, or WEBP · Up to 5MB each</p>
          </label>
          <input
            id="images"
            hidden
            multiple
            type="file"
            accept="image/*"
            onChange={uploadImages}
            disabled={saving || uploading}
          />

          {uploading && (
            <div className="rounded-xl bg-section px-4 py-3 text-sm font-medium text-primary">
              Uploading images...
            </div>
          )}

          {form.images.length > 0 && (
            <div className="mt-6">
              <h4 className="mb-4 font-semibold text-sm text-gray-700">Uploaded Images ({form.images.length})</h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                {form.images.map((img, index) => (
                  <div key={img} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <Image
                      src={img}
                      alt="Preview"
                      width={400}
                      height={400}
                      unoptimized
                      className="aspect-square h-auto w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-white">
                      {index === 0 ? "Primary" : `Image ${index + 1}`}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(img)}
                      aria-label={`Remove product image ${index + 1}`}
                      className="absolute right-2 top-2 rounded-lg bg-[#142536]/90 px-2.5 py-1.5 text-[10px] font-semibold text-white opacity-100 transition hover:bg-[#6f1d46] sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ⚙️ SETTINGS SECTION */}
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-[#142536] sm:text-lg">Publishing Settings</h3>
            <p className="mt-1 text-xs text-slate-500">Control product visibility and homepage placement</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 transition hover:border-[#6f1d46]/40 hover:bg-[#fff8fa]">
              <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} className="h-4 w-4 accent-primary" />
              <span className="text-xs font-medium text-slate-700 sm:text-sm">Featured Item</span>
            </label>
            <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 transition hover:border-[#6f1d46]/40 hover:bg-[#fff8fa]">
              <input type="checkbox" name="newArrival" checked={form.newArrival} onChange={handleChange} className="h-4 w-4 accent-primary" />
              <span className="text-xs font-medium text-slate-700 sm:text-sm">New Arrival</span>
            </label>
            <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 transition hover:border-[#6f1d46]/40 hover:bg-[#fff8fa]">
              <input type="checkbox" name="status" checked={form.status} onChange={handleChange} className="h-4 w-4 accent-primary" />
              <span className="text-xs font-medium text-slate-700 sm:text-sm">Active (Visible)</span>
            </label>
          </div>
        </div>

        {/* FORM ACTION CONTROL BUTTONS */}
        <div className="sticky bottom-0 z-10 -mx-3 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white/95 px-3 py-3 backdrop-blur sm:-mx-6 sm:flex-row sm:justify-end sm:gap-3 sm:px-6 lg:-mx-8 lg:px-8">
          <button
            type="button"
            onClick={() => {
              if (confirm("Clear all entered information?")) {
                setForm(initialState);
              }
            }}
            className="min-h-11 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-primary hover:bg-slate-50 sm:min-w-32"
          >
            Reset Form
          </button>

          <button
            type="submit"
            disabled={saving || uploading}
            className="min-h-11 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-primary-dark hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-44"
          >
            {saving ? "Saving Product..." : editing ? "Update Product" : "Save Product"}
          </button>
        </div>
      </form>

      {/* --------------------------------- Product Preview Section */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-4 sm:px-6">
          <h3 className="text-base font-bold text-[#142536] sm:text-lg">Live Product Preview</h3>
          <p className="mt-1 text-xs text-slate-500">A preview of how this listing may appear in your store</p>
        </div>
        <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-2 lg:gap-8">
          {/* Image Block */}
          <div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <Image
                src={form.images[0] || "https://placehold.co/700x900?text=No+Image"}
                alt="Preview"
                width={700}
                height={900}
                unoptimized
                className="aspect-[4/5] max-h-[520px] w-full object-cover"
              />
            </div>
          </div>

          {/* Content Details Block */}
          <div>
            <h2 className="text-2xl font-bold text-[#142536] sm:text-3xl">{form.name || "Product Name"}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{form.shortDescription || "Short description will appear here."}</p>
            
            <div className="mt-6 flex items-center gap-4">
              {form.discountPrice ? (
                <>
                  <span className="text-3xl font-bold text-primary">Rs. {form.discountPrice}</span>
                  <span className="text-xl text-gray-400 line-through">Rs. {form.price || 0}</span>
                </>
              ) : (
                <span className="text-3xl font-bold text-primary">Rs. {form.price || 0}</span>
              )}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Category</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {resolvedCategories.find((c) => c._id === form.category)?.name || "-"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Collection</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {resolvedCollections.find((c) => c._id === form.collection)?.title || "-"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Stock</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">{form.stock || 0} Pieces</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">SKU</p>
                <p className="mt-2 break-all text-sm font-semibold text-slate-800">{form.sku || "-"}</p>
              </div>
            </div>

            {/* Badges Layout Container */}
            <div className="mt-8 flex flex-wrap gap-3">
              {form.featured && (
                <span className="rounded-full bg-[#fff6e5] px-3 py-1.5 text-xs font-semibold text-[#8a5b12]">
                  ⭐ Featured
                </span>
              )}
              {form.newArrival && (
                <span className="rounded-full bg-[#f8edf2] px-3 py-1.5 text-xs font-semibold text-[#6f1d46]">
                  🆕 New Arrival
                </span>
              )}
              {form.status ? (
                <span className="rounded-full bg-[#edf3f8] px-3 py-1.5 text-xs font-semibold text-[#142536]">
                  ✔ Active
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}