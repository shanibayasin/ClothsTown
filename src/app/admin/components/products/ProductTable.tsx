"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Pencil,
  Trash2,
  Star,
  Package,
} from "lucide-react";

interface Props {
  refresh: number;
  onEdit: (product: any) => void;
}

export default function ProductTable({
  refresh,
  onEdit,
}: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [refresh]);

  async function fetchProducts() {
    setLoading(true);

    const res = await fetch("/api/products");
    const data = await res.json();

    setProducts(data);

    setLoading(false);
  }

  async function deleteProduct(id: string) {
    const ok = confirm(
      "Delete this product?"
    );

    if (!ok) return;

    await fetch(`/api/products/${id}`, {
      method: "DELETE",
    });

    fetchProducts();
  }

  if (loading)
    return (
      <div className="rounded-xl bg-white p-10 text-center shadow">
        Loading Products...
      </div>
    );

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow">

      <div className="border-b p-6">

        <h2 className="text-2xl font-bold text-[#6f1d46]">
          Products
        </h2>

      </div>

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead className="bg-gray-100">

            <tr>

              <th className="px-5 py-4 text-left">
                Image
              </th>

              <th className="px-5 py-4 text-left">
                Product
              </th>

              <th className="px-5 py-4 text-left">
                Category
              </th>

              <th className="px-5 py-4 text-left">
                Collection
              </th>

              <th className="px-5 py-4 text-left">
                Price
              </th>

              <th className="px-5 py-4 text-left">
                Stock
              </th>

              <th className="px-5 py-4 text-left">
                Status
              </th>

              <th className="px-5 py-4 text-center">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {products.map((product) => (

              <tr
                key={product._id}
                className="border-b hover:bg-gray-50"
              >

                <td className="px-5 py-4">

                  <Image
                    src={
                      product.images?.[0] &&
                      product.images[0].includes("res.cloudinary.com")
                        ? product.images[0]
                        : "/placeholder.png"
                    }
                    alt={product.name}
                    width={70}
                    height={70}
                    className="rounded-lg object-cover"
                  />

                </td>

                <td className="px-5 py-4">

                  <h3 className="font-semibold">
                    {product.name}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {product.sku}
                  </p>

                </td>

                <td className="px-5 py-4">

                  {product.category?.name}

                </td>

                <td className="px-5 py-4">

                  {product.collection?.title}

                </td>

                <td className="px-5 py-4">

                  <div>

                    <span className="font-semibold">
                      Rs.{" "}
                      {product.discountPrice ||
                        product.price}
                    </span>

                    {product.discountPrice >
                      0 && (
                      <p className="text-sm text-gray-400 line-through">
                        Rs. {product.price}
                      </p>
                    )}

                  </div>

                </td>

                <td className="px-5 py-4">

                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm">

                    <Package
                      size={15}
                    />

                    {product.stock}

                  </span>

                </td>

                <td className="px-5 py-4">

                  <div className="flex flex-col gap-2">

                    {product.featured && (
                      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs">

                        <Star
                          size={12}
                        />

                        Featured

                      </span>
                    )}

                    {product.newArrival && (
                      <span className="inline-flex w-fit rounded-full bg-green-100 px-3 py-1 text-xs">

                        New

                      </span>
                    )}

                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs

                      ${
                        product.status
                          ? "bg-green-200"
                          : "bg-red-200"
                      }

                      `}
                    >
                      {product.status
                        ? "Active"
                        : "Inactive"}
                    </span>

                  </div>

                </td>

                <td className="px-5 py-4">

                  <div className="flex justify-center gap-3">

                    <button
                      onClick={() =>
                        onEdit(product)
                      }
                      className="rounded-lg bg-blue-500 p-2 text-white"
                    >
                      <Pencil
                        size={18}
                      />
                    </button>

                    <button
                      onClick={() =>
                        deleteProduct(
                          product._id
                        )
                      }
                      className="rounded-lg bg-red-500 p-2 text-white"
                    >
                      <Trash2
                        size={18}
                      />
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