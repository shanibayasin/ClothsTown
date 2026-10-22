"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Pencil,
  Trash2,
  Star,
  Package,
  Image as ImageIcon,
} from "lucide-react";

export interface AdminProduct {
  _id: string;
  name: string;
  sku?: string;
  images?: string[];
  category?: string | { _id: string; name?: string };
  collection?: string | { _id: string; title?: string };
  price: number;
  discountPrice?: number;
  stock?: number;
  season?: string;
  fabric?: string;
  featured?: boolean;
  newArrival?: boolean;
  status?: boolean;
}

interface Props {
  refresh: number;
  onEdit: (product: AdminProduct) => void;
  categoryId?: string;
}

export default function ProductTable({
  refresh,
  onEdit,
  categoryId,
}: Props) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/products")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Products request failed (${response.status}).`);
        }
        return response.json();
      })
      .then((data) => {
        if (!active) return;

        const fetchedProducts: AdminProduct[] = Array.isArray(data)
          ? data.filter(
              (product): product is AdminProduct =>
                product &&
                typeof product._id === "string" &&
                typeof product.name === "string"
            )
          : [];
        setProducts(
          categoryId
            ? fetchedProducts.filter(
                (product) =>
                  (typeof product.category === "object" && product.category
                    ? product.category._id
                    : product.category) === categoryId
              )
            : fetchedProducts
        );
      })
      .catch((error: unknown) => {
        console.error("Failed to load products:", error);
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refresh, categoryId]);

  async function readJsonResponse(
    response: Response
  ): Promise<{ message?: string }> {
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      const text = await response.text();
      return text ? { message: text } : {};
    }

    const text = await response.text();
    if (!text) return {};

    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  }

  async function deleteProduct(id: string) {
    const ok = confirm(
      "Delete this product?"
    );

    if (!ok) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete product.");
      }

      setProducts((currentProducts) =>
        currentProducts.filter((product) => product._id !== id)
      );
    } catch (error) {
      console.error("Failed to delete product:", error);
      window.alert(
        error instanceof Error ? error.message : "Failed to delete product."
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (loading)
    return (
      <div className="rounded-xl border border-[#e9e5df] bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
        Loading Products...
      </div>
    );

  return (
    <div className="overflow-hidden rounded-xl border border-[#e9e5df] bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-[#eeeae4] px-4 py-4 sm:flex-row sm:items-center sm:px-5">
        <div>
          <h2 className="text-base font-bold text-[#24211e]">Products</h2>
          <p className="mt-1 text-xs text-slate-500">Manage all your products in one place.</p>
        </div>
        <span className="w-fit rounded-full bg-[#f5f2ed] px-3 py-1 text-[11px] font-medium text-slate-600">
          {products.length} {products.length === 1 ? "product" : "products"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full text-left">
          <thead className="bg-[#faf9f7]">
            <tr>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Image
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Product
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Category
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Collection
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Price
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Stock
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0ede8]">
            {products.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-xs text-slate-500">
                  No products yet.
                </td>
              </tr>
            ) : products.map((product) => (
              <tr
                key={product._id}
                className="transition-colors hover:bg-[#fcfbf9]"
              >
                <td className="px-4 py-2.5">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      width={44}
                      height={52}
                      unoptimized
                      className="h-12 w-10 rounded-md border border-[#eeeae4] object-cover"
                    />
                  ) : (
                    <div
                      aria-label={`No image for ${product.name}`}
                      className="flex h-12 w-10 items-center justify-center rounded-md border border-[#eeeae4] bg-[#f5f2ed] text-slate-400"
                    >
                      <ImageIcon size={15} aria-hidden="true" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <h3 className="text-xs font-semibold text-[#292521]">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {product.sku}
                  </p>
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-600">
                  {typeof product.category === "object"
                    ? product.category?.name
                    : ""}
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-600">
                  {typeof product.collection === "object"
                    ? product.collection?.title
                    : ""}
                </td>
                <td className="px-4 py-2.5">
                  <div className="text-xs">
                    <span className="font-semibold text-[#292521]">
                      Rs.{" "}
                      {product.discountPrice ||
                        product.price}
                    </span>

                    {(product.discountPrice ?? 0) > 0 && (
                      <p className="mt-0.5 text-[10px] text-gray-400 line-through">
                        Rs. {product.price}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#f3f1ed] px-2.5 py-1 text-[11px] font-medium text-slate-700">
                    <Package size={13} />
                    {product.stock}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-col items-start gap-1">
                    {product.featured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#fbf3df] px-2 py-1 text-[10px] text-[#826123]">
                        <Star size={11} />
                        Featured
                      </span>
                    )}
                    {product.newArrival && (
                      <span className="inline-flex rounded-full bg-[#f0f3ee] px-2 py-1 text-[10px] text-[#536b50]">
                        New
                      </span>
                    )}
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${
                        product.status
                          ? "bg-[#eaf4eb] text-[#42664a]"
                          : "bg-[#f4eaea] text-[#8a4d4d]"
                      }`}
                    >
                      {product.status ? "Active" : "Inactive"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-center gap-1.5">
                    <button
                      onClick={() => onEdit(product)}
                      aria-label={`Edit ${product.name}`}
                      className="rounded-md border border-[#e9e5df] p-2 text-slate-600 transition hover:bg-[#f5f2ed] hover:text-[#292521]"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => deleteProduct(product._id)}
                      aria-label={`Delete ${product.name}`}
                      disabled={deletingId === product._id}
                      className="rounded-md border border-[#e9e5df] p-2 text-slate-600 transition hover:border-[#e8ceca] hover:bg-[#f8efed] hover:text-[#9b4c42]"
                    >
                      <Trash2 size={14} className={deletingId === product._id ? "opacity-40" : ""} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}