"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

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

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          alert(data.message || "Upload failed");
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
    <div className="mx-auto max-w-5xl space-y-12">
      <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-8 shadow-sm border border-gray-100 space-y-8">
        <h2 className="text-2xl font-bold text-heading">
          {editing ? "Edit Product Details" : "Add New Luxury Product"}
        </h2>

        {/* 📝 BASIC INFORMATION SECTION */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary border-b border-gray-100 pb-2">📝 Basic Information</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
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
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Slug URL Path</label>
              <input
                type="text"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="classic-winter-coat"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none"
                readOnly
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Short Description</label>
              <input
                type="text"
                name="shortDescription"
                value={form.shortDescription}
                onChange={handleChange}
                maxLength={160}
                placeholder="Brief line about the fabric or cut..."
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:outline-none"
              />
              <div className="mt-2 text-right text-xs text-gray-400">
                {form.shortDescription.length}/160 Characters
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Detailed Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                maxLength={1000}
                rows={4}
                placeholder="Describe the product material, design, care instructions..."
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:outline-none"
              />
              <div className="mt-2 text-right text-xs text-gray-400">
                {form.description.length}/1000 Characters
              </div>
            </div>
          </div>
        </div>

        {/* 📂 ORGANIZATION SECTION */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary border-b border-gray-100 pb-2">📂 Organization</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">Select Category</option>
                {resolvedCategories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Collection</label>
              <select
                name="collection"
                value={form.collection}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:outline-none"
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
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary border-b border-gray-100 pb-2">💰 Pricing & Inventory</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Price (Rs.)</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="8500"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Discount Price (Rs.)</label>
              <input
                type="number"
                name="discountPrice"
                value={form.discountPrice}
                onChange={handleChange}
                placeholder="7999"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Inventory</label>
              <input
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                placeholder="50"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Product SKU</label>
              <input
                type="text"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder="VEL-AB-123"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 📏 SIZES SECTION */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary border-b border-gray-100 pb-2">📏 Sizes</h3>
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
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary border-b border-gray-100 pb-2">🎨 Colors</h3>
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
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary border-b border-gray-100 pb-2">📸 Product Media</h3>
          <label
            htmlFor="images"
            className="flex h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d7c2cb] bg-section transition hover:border-primary hover:bg-[#fff8fa]"
          >
            <span className="text-4xl mb-2">📷</span>
            <h4 className="text-base font-semibold text-heading">Upload Product Images</h4>
            <p className="mt-1 text-xs text-gray-400">JPG • PNG • WEBP (Max 5MB)</p>
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
              <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
                {form.images.map((img, index) => (
                  <div key={img} className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <Image
                      src={img}
                      alt="Preview"
                      width={400}
                      height={400}
                      className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-white">
                      {index === 0 ? "Primary" : `Image ${index + 1}`}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(img)}
                      className="absolute right-3 top-3 rounded-lg bg-red-600 px-3 py-1 text-[11px] font-medium text-white opacity-0 transition group-hover:opacity-100 shadow-lg"
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
        <div className="space-y-4 border-t border-gray-100 pt-6">
          <h3 className="text-lg font-semibold text-primary pb-2">⚙️ Settings</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} className="accent-primary h-4 w-4" />
              <span className="text-sm font-medium text-gray-700">Featured Item</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="newArrival" checked={form.newArrival} onChange={handleChange} className="accent-primary h-4 w-4" />
              <span className="text-sm font-medium text-gray-700">New Arrival</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="status" checked={form.status} onChange={handleChange} className="accent-primary h-4 w-4" />
              <span className="text-sm font-medium text-gray-700">Active (Visible)</span>
            </label>
          </div>
        </div>

        {/* FORM ACTION CONTROL BUTTONS */}
        <div className="flex items-center justify-end gap-4 border-t border-gray-100 pt-6">
          <button
            type="button"
            onClick={() => {
              if (confirm("Clear all entered information?")) {
                setForm(initialState);
              }
            }}
            className="rounded-xl border border-gray-300 px-6 py-3 font-medium transition hover:border-primary hover:bg-section"
          >
            Reset Form
          </button>

          <button
            type="submit"
            disabled={saving || uploading}
            className="rounded-xl bg-primary px-8 py-3 font-semibold text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-primary-dark hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving Product..." : editing ? "Update Product" : "Save Product"}
          </button>
        </div>
      </form>

      {/* --------------------------------- Product Preview Section */}
      <div className="mt-10 rounded-3xl border border-[#ead7df] bg-[#fffafc] p-8">
        <h3 className="mb-8 text-xl font-bold text-primary">Live Product Preview</h3>
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image Block */}
          <div>
            <div className="overflow-hidden rounded-3xl border bg-white">
              <Image
                src={form.images[0] || "https://placehold.co/700x900?text=No+Image"}
                alt="Preview"
                width={700}
                height={900}
                className="h-112.5 w-full object-cover"
              />
            </div>
          </div>

          {/* Content Details Block */}
          <div>
            <h2 className="text-3xl font-bold text-heading">{form.name || "Product Name"}</h2>
            <p className="mt-3 text-gray-600">{form.shortDescription || "Short description will appear here."}</p>
            
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
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase text-gray-400">Category</p>
                <p className="mt-2 font-semibold">
                  {categories.find((c) => c._id === form.category)?.name || "-"}
                </p>
              </div>

              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase text-gray-400">Collection</p>
                <p className="mt-2 font-semibold">
                  {collections.find((c) => c._id === form.collection)?.title || "-"}
                </p>
              </div>

              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase text-gray-400">Stock</p>
                <p className="mt-2 font-semibold">{form.stock || 0} Pieces</p>
              </div>

              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase text-gray-400">SKU</p>
                <p className="mt-2 font-semibold">{form.sku || "-"}</p>
              </div>
            </div>

            {/* Badges Layout Container */}
            <div className="mt-8 flex flex-wrap gap-3">
              {form.featured && (
                <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-700">
                  ⭐ Featured
                </span>
              )}
              {form.newArrival && (
                <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                  🆕 New Arrival
                </span>
              )}
              {form.status ? (
                <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                  ✔ Active
                </span>
              ) : (
                <span className="rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
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