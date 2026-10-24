"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  Check,
  Image as ImageIcon,
  Layers,
  Package,
  Ruler,
  Settings2,
  Shapes,
  Tag,
  UploadCloud,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { prepareImageForUpload } from "@/lib/image-upload";
import {
  createProductSlug,
  getCanonicalProductFields,
} from "@/lib/products";
import type { AdminProduct } from "./ProductTable";

interface Category {
  _id: string;
  name: string;
  parentCategory?: string | null;
  gender?: ProductFormState["gender"];
  group?: string;
}

interface Collection {
  _id: string;
  title: string;
}

interface ProductFormProps {
  editing?: AdminProduct | null;
  categories: Category[];
  collections: Collection[];
  onSuccess: () => void;
  forceNewArrival?: boolean;
  preselectedCategoryId?: string;
}

interface ProductFormState {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  season: string;
  fabric: string;
  brand: string;
  productType: string;
  fragranceType: string;
  bottleSize: string;
  price: string;
  discountPrice: string;
  stock: string;
  sku: string;
  category: string;
  gender: "men" | "women" | "girls" | "boys" | "unisex";
  collections: string[];
  images: string[];
  sizes: string[];
  colors: string[];
  featured: boolean;
  onSale: boolean;
  newArrival: boolean;
  status: boolean;
  publicationStatus: "active" | "draft" | "inactive";
}

const initialState: ProductFormState = {
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  season: "",
  fabric: "",
  brand: "",
  productType: "",
  fragranceType: "",
  bottleSize: "",
  price: "",
  discountPrice: "",
  stock: "",
  sku: "",
  category: "",
  gender: "unisex",
  collections: [],
  images: [],
  sizes: [],
  colors: [],
  featured: false,
  onSale: false,
  newArrival: false,
  status: true,
  publicationStatus: "active",
};

function createFormState(
  editing: AdminProduct | null | undefined,
  forceNewArrival: boolean,
  preselectedCategoryId: string,
  categories: Category[]
): ProductFormState {
  if (!editing) {
    return {
      ...initialState,
      newArrival: forceNewArrival,
      category: preselectedCategoryId,
      gender:
        categories.find((category) => category._id === preselectedCategoryId)
          ?.gender ?? initialState.gender,
    };
  }

  const productFields = getCanonicalProductFields(editing);

  return {
    ...initialState,
    name: editing.name ?? "",
    slug: editing.slug ?? "",
    shortDescription: editing.shortDescription ?? "",
    description: editing.description ?? "",
    season: editing.season ?? "",
    fabric: editing.fabric ?? "",
    brand: editing.brand ?? "",
    productType: editing.productType ?? "",
    fragranceType: editing.fragranceType ?? "",
    bottleSize: editing.bottleSize ?? "",
    price: String(editing.price ?? ""),
    discountPrice: String(editing.discountPrice ?? ""),
    stock: String(editing.stock ?? ""),
    sku: editing.sku ?? "",
    category:
      typeof editing.category === "object"
        ? editing.category?._id ?? ""
        : editing.category ?? "",
    gender: editing.gender ?? "unisex",
    collections: productFields.collectionIds,
    images: editing.images ?? [],
    sizes: editing.sizes ?? [],
    colors: editing.colors ?? [],
    featured: productFields.featured,
    onSale:
      editing.onSale === true ||
      (editing.onSale === undefined &&
        Number(editing.discountPrice) > 0 &&
        Number(editing.discountPrice) < Number(editing.price)),
    newArrival: forceNewArrival || productFields.newArrival,
    status: productFields.publicationStatus === "active",
    publicationStatus: productFields.publicationStatus,
  };
}

const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];
const colorOptions = ["Black", "White", "Brown", "Beige", "Navy", "Grey", "Olive", "Maroon"];

export default function ProductForm({
  editing,
  categories,
  collections,
  onSuccess,
  forceNewArrival = false,
  preselectedCategoryId = "",
}: ProductFormProps) {
  const [form, setForm] = useState<ProductFormState>(() =>
    createFormState(editing, forceNewArrival, preselectedCategoryId, categories)
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
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
              (item: unknown): item is Category & { status?: boolean } =>
                typeof item === "object" &&
                item !== null &&
                "_id" in item &&
                typeof item._id === "string" &&
                "name" in item &&
                typeof item.name === "string" &&
                (!("status" in item) || item.status !== false)
            )
          : [];

        const normalizedCollections = Array.isArray(colData)
          ? colData.filter(
              (item: unknown): item is Collection & { status?: boolean } =>
                typeof item === "object" &&
                item !== null &&
                "_id" in item &&
                typeof item._id === "string" &&
                "title" in item &&
                typeof item.title === "string" &&
                (!("status" in item) || item.status !== false)
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (name === "category") {
      const selectedCategory = resolvedCategories.find(
        (category) => category._id === value
      );
      setForm((previous) => ({
        ...previous,
        category: value,
        gender: selectedCategory?.gender ?? previous.gender,
      }));
      return;
    }
    
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
        try {
          const formData = new FormData();
          formData.append("file", await prepareImageForUpload(file));

          const res = await adminFetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          if (!res.ok) {
            if (res.status === 401) return;
            throw new Error(data.error || data.message || `Upload failed (${res.status}).`);
          }
          uploaded.push(data.url);
        } catch (error) {
          console.error(error);
          alert(
            `${file.name}: ${
              error instanceof Error ? error.message : "Image upload failed."
            }`
          );
        }
      }

      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...uploaded],
      }));
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
    if (saving || uploading) return;
    setMessage(null);

    if (!form.name.trim() || form.name.trim().length < 3) {
      return setMessage({ type: "error", text: "Product name must be at least 3 characters." });
    }
    if (!form.category) {
      return setMessage({ type: "error", text: "Please select a category." });
    }
    if (!form.price || !Number.isFinite(Number(form.price)) || Number(form.price) <= 0) {
      return setMessage({ type: "error", text: "Valid price is required." });
    }
    if (Number(form.discountPrice) > Number(form.price)) {
      return setMessage({ type: "error", text: "Discount price cannot be greater than product price." });
    }
    if (!Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) {
      return setMessage({ type: "error", text: "Stock must be a non-negative whole number." });
    }

    setSaving(true);

    const payload = {
      ...form,
      collection: form.collections[0],
      collections: Array.from(new Set(form.collections)),
      newArrival: forceNewArrival || form.newArrival,
      publicationStatus: form.publicationStatus,
      status: form.publicationStatus === "active",
      sku: form.sku.trim(),
      price: Number(form.price),
      discountPrice: Number(form.discountPrice || 0),
      stock: Number(form.stock),
    };

    try {
      const url = editing ? `/api/products/${editing._id}` : "/api/products";
      const method = editing ? "PUT" : "POST";

      const res = await adminFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.message || "Failed to save product." });
        return;
      }

      setMessage({
        type: "success",
        text: editing ? "Product updated successfully." : "Product added successfully.",
      });
      if (!editing) {
        setForm({
          ...initialState,
          newArrival: forceNewArrival,
          category: preselectedCategoryId,
        });
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full">
      {message && (
        <p
          role={message.type === "error" ? "alert" : "status"}
          className={`mb-3 rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </p>
      )}
      <form onSubmit={handleSubmit} className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#e9e5df] bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:px-5 lg:col-span-2">
          <div>
            <p className="text-xs font-medium text-slate-500">Products / {editing ? "Edit product" : "New product"}</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-[#24211e] sm:text-2xl">
              {editing ? "Edit Product" : "Add New Product"}
            </h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Create a new product and make it available in your store.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (confirm("Clear all entered information?")) {
                  setForm({
                    ...initialState,
                    newArrival: forceNewArrival,
                    category: preselectedCategoryId,
                  });
                }
              }}
              className="min-h-10 rounded-lg border border-[#e7e2dc] bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-[#f8f6f3]"
            >
              Reset Form
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#33291f] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#4a3b2e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Check size={15} aria-hidden="true" />
              {saving ? "Saving Product..." : editing ? "Update Product" : "Save Product"}
            </button>
          </div>
        </div>

        <div className="min-w-0 space-y-3">
        {/* 📝 BASIC INFORMATION SECTION */}
        <div className="order-1 space-y-4 rounded-xl border border-[#e9e5df] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
            <Package size={18} className="mt-0.5 shrink-0 text-[#51483e]" aria-hidden="true" />
            <div>
            <h3 className="text-sm font-bold text-[#24211e] sm:text-base">Basic Information</h3>
            <p className="mt-1 text-xs text-slate-500">Start with the details needed to publish this product.</p>
            </div>
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
                    slug: createProductSlug(value),
                  });
                }}
                placeholder="e.g., Classic Winter Coat"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 sm:text-sm"
              />
            </div>
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
                  <option key={cat._id} value={cat._id}>
                    {cat.group ? `${cat.group} / ${cat.name}` : cat.name}
                  </option>
                ))}
              </select>
            </div>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-slate-700 sm:text-sm">Product audience</span>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 sm:text-sm"
              >
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="girls">Girls</option>
                <option value="boys">Boys</option>
                <option value="unisex">Unisex</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-slate-700 sm:text-sm">Publication status</span>
              <select
                name="publicationStatus"
                value={form.publicationStatus}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    publicationStatus: event.target.value as ProductFormState["publicationStatus"],
                    status: event.target.value === "active",
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 sm:text-sm"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
        </div>

        <details className="order-6 rounded-xl border border-[#e9e5df] bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center gap-3 p-4 sm:p-5">
            <Shapes size={18} className="shrink-0 text-[#51483e]" aria-hidden="true" />
            <span>
              <span className="block text-sm font-bold text-[#24211e] sm:text-base">Advanced Options</span>
              <span className="mt-1 block text-xs text-slate-500">
                Slug, descriptions, collections, materials, product type, and fragrance details.
              </span>
            </span>
          </summary>
          <div className="space-y-4 border-t border-slate-100 p-4 sm:p-5">
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
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
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
            <div>
              <span className="mb-2 block text-xs font-semibold text-slate-700 sm:text-sm">
                Collections
              </span>
              <div className="max-h-44 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">
                {resolvedCollections.map((col) => (
                  <label key={col._id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.collections.includes(col._id)}
                      onChange={() =>
                        setForm((current) => ({
                          ...current,
                          collections: current.collections.includes(col._id)
                            ? current.collections.filter((id) => id !== col._id)
                            : [...current.collections, col._id],
                        }))
                      }
                      className="size-4 accent-primary"
                    />
                    {col.title}
                  </label>
                ))}
                {resolvedCollections.length === 0 && (
                  <p className="text-xs text-slate-500">Create a collection before assigning products.</p>
                )}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700 sm:text-sm">Season</label>
              <input
                type="text"
                name="season"
                value={form.season}
                onChange={handleChange}
                placeholder="e.g., Winter"
                maxLength={60}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 sm:text-sm"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700 sm:text-sm">Fabric</label>
              <input
                type="text"
                name="fabric"
                value={form.fabric}
                onChange={handleChange}
                placeholder="e.g., Cambric"
                maxLength={60}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 sm:text-sm"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700 sm:text-sm">Brand</label>
              <input
                type="text"
                name="brand"
                value={form.brand}
                onChange={handleChange}
                maxLength={120}
                placeholder="Brand (optional)"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 sm:text-sm"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700 sm:text-sm">Product type</label>
              <input
                type="text"
                name="productType"
                value={form.productType}
                onChange={handleChange}
                maxLength={120}
                placeholder="e.g., Kurta, perfume, footwear"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 sm:text-sm"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700 sm:text-sm">Fragrance type</label>
              <input
                type="text"
                name="fragranceType"
                value={form.fragranceType}
                onChange={handleChange}
                maxLength={120}
                placeholder="e.g., Eau de parfum, attar"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 sm:text-sm"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700 sm:text-sm">Bottle size</label>
              <input
                type="text"
                name="bottleSize"
                value={form.bottleSize}
                onChange={handleChange}
                maxLength={120}
                placeholder="e.g., 50 ml"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 sm:text-sm"
              />
            </div>
          </div>
          </div>
        </details>

        {/* 💰 PRICING & INVENTORY SECTION */}
        <div className="order-3 space-y-4 rounded-xl border border-[#e9e5df] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
            <Tag size={18} className="mt-0.5 shrink-0 text-[#51483e]" aria-hidden="true" />
            <div>
            <h3 className="text-sm font-bold text-[#24211e] sm:text-base">Pricing & Inventory</h3>
            <p className="mt-1 text-xs text-slate-500">Set your price, discount, available quantity, and SKU</p>
            </div>
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
                placeholder="Leave blank to generate a unique SKU"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* 📏 SIZES SECTION */}
        <div className="order-4 space-y-4 rounded-xl border border-[#e9e5df] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
            <Ruler size={18} className="mt-0.5 shrink-0 text-[#51483e]" aria-hidden="true" />
            <div>
            <h3 className="text-sm font-bold text-[#24211e] sm:text-base">Variants</h3>
            <p className="mt-1 text-xs text-slate-500">Select the available sizes and colors.</p>
            </div>
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
        {/* 🎨 COLOR SECTION */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700">Available Colors</p>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((clr) => (
              <button
                type="button"
                key={clr}
                onClick={() => toggleArray("colors", clr)}
                aria-pressed={form.colors.includes(clr)}
                className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
                  form.colors.includes(clr)
                    ? "border border-[#51483e] bg-[#f4f0eb] text-[#29231e]"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {clr}
              </button>
            ))}
          </div>
          </div>
        </div>

        {/* MEDIA MANAGEMENT */}
        <div className="order-2 space-y-3 rounded-xl border border-[#e9e5df] bg-white p-3 shadow-sm sm:p-4">
          <div className="flex items-start gap-2.5 border-b border-slate-100 pb-2.5">
            <ImageIcon size={16} className="mt-0.5 shrink-0 text-[#51483e]" aria-hidden="true" />
            <div>
            <h3 className="text-xs font-bold text-[#24211e] sm:text-sm">Media</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">Upload clear product photos; the first image is the primary image</p>
            </div>
          </div>
          <label
            htmlFor="images"
            className={`flex h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-[#faf9f7] px-3 text-center transition hover:border-[#8a7966] hover:bg-[#f7f4f0] sm:h-28 ${uploading ? "pointer-events-none opacity-60" : ""}`}
          >
            <UploadCloud size={18} className="mb-1.5 text-[#655b50]" aria-hidden="true" />
            <h4 className="text-[11px] font-semibold text-[#24211e]">{uploading ? "Uploading images..." : "Upload product images"}</h4>
            <p className="mt-0.5 text-[10px] text-slate-500">JPG, PNG, or WEBP · Max 5MB each</p>
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
            <div className="mt-3">
              <h4 className="mb-2 text-xs font-semibold text-gray-700">Uploaded Images ({form.images.length})</h4>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {form.images.map((img, index) => (
                  <div key={img} className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <Image
                      src={img}
                      alt="Preview"
                      width={400}
                      height={400}
                      unoptimized
                      className="aspect-square h-auto w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute left-1.5 top-1.5 rounded-full bg-[#33291f] px-2 py-1 text-[9px] font-bold text-white">
                      {index === 0 ? "Primary" : `Image ${index + 1}`}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(img)}
                      aria-label={`Remove product image ${index + 1}`}
                      className="absolute right-1 top-1 rounded-md bg-black/75 px-2 py-1 text-[9px] font-semibold text-white opacity-100 transition hover:bg-black sm:opacity-0 sm:group-hover:opacity-100"
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
        <div className="order-5 space-y-4 rounded-xl border border-[#e9e5df] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
            <Settings2 size={18} className="mt-0.5 shrink-0 text-[#51483e]" aria-hidden="true" />
            <div>
            <h3 className="text-sm font-bold text-[#24211e] sm:text-base">Publishing & Visibility</h3>
            <p className="mt-1 text-xs text-slate-500">Control product visibility and homepage placement</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 transition hover:border-[#6f1d46]/40 hover:bg-[#fff8fa]">
              <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} className="h-4 w-4 accent-primary" />
              <span className="text-xs font-medium text-slate-700 sm:text-sm">Featured Item</span>
            </label>
            <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 transition hover:border-[#6f1d46]/40 hover:bg-[#fff8fa]">
              <input type="checkbox" name="onSale" checked={form.onSale} onChange={handleChange} className="h-4 w-4 accent-primary" />
              <span className="text-xs font-medium text-slate-700 sm:text-sm">Sale Item</span>
            </label>
            {forceNewArrival ? (
              <div className="flex min-h-12 items-center gap-3 rounded-xl border border-[#6f1d46]/30 bg-[#fff8fa] px-3 py-2.5">
                <input
                  type="checkbox"
                  checked
                  disabled
                  aria-label="New Arrival enabled"
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-xs font-medium text-slate-700 sm:text-sm">
                  New Arrival (required)
                </span>
              </div>
            ) : (
              <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 transition hover:border-[#6f1d46]/40 hover:bg-[#fff8fa]">
                <input type="checkbox" name="newArrival" checked={form.newArrival} onChange={handleChange} className="h-4 w-4 accent-primary" />
                <span className="text-xs font-medium text-slate-700 sm:text-sm">New Arrival</span>
              </label>
            )}
          </div>
        </div>

        </div>

        <aside className="space-y-3 lg:sticky lg:top-5">
          <div className="overflow-hidden rounded-xl border border-[#e9e5df] bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <ImageIcon size={15} className="text-[#51483e]" aria-hidden="true" />
              <h3 className="text-xs font-bold text-[#24211e]">Live Product Preview</h3>
            </div>
            <div className="relative overflow-hidden rounded-lg bg-[#f1efec]">
              {form.images[0] ? (
                <Image
                  src={form.images[0]}
                  alt="Preview"
                  width={700}
                  height={900}
                  unoptimized
                  className="aspect-[4/4.3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/4.3] flex-col items-center justify-center gap-2 text-slate-400">
                  <ImageIcon size={24} aria-hidden="true" />
                  <span className="text-[11px]">Product image preview</span>
                </div>
              )}
              {form.newArrival && (
                <span className="absolute left-2 top-2 rounded-full bg-[#51483e] px-2.5 py-1 text-[10px] font-semibold text-white">
                  New
                </span>
              )}
            </div>
            <div className="px-0.5 pt-3">
              <h4 className="truncate text-sm font-bold text-[#24211e]">{form.name || "Product Name"}</h4>
              <p className="mt-1 line-clamp-2 min-h-8 text-xs leading-4 text-slate-500">
                {form.shortDescription || "Your product description will appear here."}
              </p>
              <p className="mt-2 text-base font-bold text-[#33291f]">
                Rs. {form.discountPrice || form.price || 0}
                {form.discountPrice && (
                  <span className="ml-2 text-xs font-normal text-slate-400 line-through">
                    Rs. {form.price || 0}
                  </span>
                )}
              </p>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-[#8a6b36]">
                <span aria-hidden="true">★</span>
                <span className="text-slate-500">0.0 (0 reviews)</span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-[#eeeae4] p-2">
                <p className="text-[10px] text-slate-500">Category</p>
                <p className="mt-1 truncate text-[11px] font-semibold text-slate-700">
                  {resolvedCategories.find((c) => c._id === form.category)?.name || "—"}
                </p>
              </div>
              <div className="rounded-lg border border-[#eeeae4] p-2">
                <p className="text-[10px] text-slate-500">Collection</p>
                <p className="mt-1 truncate text-[11px] font-semibold text-slate-700">
                  {resolvedCollections
                    .filter((collection) => form.collections.includes(collection._id))
                    .map((collection) => collection.title)
                    .join(", ") || "—"}
                </p>
              </div>
              <div className="rounded-lg border border-[#eeeae4] p-2">
                <p className="text-[10px] text-slate-500">Colors</p>
                <p className="mt-1 truncate text-[11px] font-semibold text-slate-700">
                  {form.colors.length ? form.colors.join(", ") : "—"}
                </p>
              </div>
              <div className="rounded-lg border border-[#eeeae4] p-2">
                <p className="text-[10px] text-slate-500">Sizes</p>
                <p className="mt-1 truncate text-[11px] font-semibold text-slate-700">
                  {form.sizes.length ? form.sizes.join(", ") : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#e9e5df] bg-white p-3 shadow-sm">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-bold text-[#24211e]">
              <Layers size={14} aria-hidden="true" />
              Quick Tips
            </h3>
            <ul className="space-y-2 text-[11px] leading-4 text-slate-600">
              {[
                "Use high-quality images (at least 5).",
                "Keep product name short and clear.",
                "Write a detailed description.",
                "Set accurate price and stock.",
                "Use relevant categories and collections.",
              ].map((tip) => (
                <li key={tip} className="flex gap-2">
                  <Check size={13} className="mt-0.5 shrink-0 text-[#54745d]" aria-hidden="true" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </form>
    </div>
  );
}