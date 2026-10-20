"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Pencil, Trash2, Search } from "lucide-react";

interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
  status: boolean;
}

interface Props {
  refresh: number;
  onEdit: (category: Category) => void;
}

export default function CategoryTable({
  refresh,
  onEdit,
}: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCategories();
  }, [refresh]);

  async function fetchCategories() {
    try {
      setLoading(true);

      const res = await fetch("/api/categories", {
        cache: "no-store",
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : [];

      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteCategory(id: string) {
    const confirmDelete = window.confirm(
      "Delete this category?"
    );

    if (!confirmDelete) return;

    await fetch(`/api/categories/${id}`, {
      method: "DELETE",
    });

    fetchCategories();
  }

  const filteredCategories = useMemo(() => {
    return categories.filter((item) =>
      item.name
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [categories, search]);

  return (
    <div className="rounded-2xl bg-white shadow">

      {/* Header */}

      <div className="flex items-center justify-between border-b p-6">

        <div>
          <h2 className="text-xl font-bold text-[#6f1d46]">
            Categories
          </h2>

          <p className="text-sm text-gray-500">
            Manage product categories
          </p>
        </div>

        <div className="relative w-72">

          <Search
            size={18}
            className="absolute left-3 top-3 text-gray-400"
          />

          <input
            placeholder="Search category..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="h-11 w-full rounded-xl border pl-10 pr-4 outline-none focus:border-[#6f1d46]"
          />

        </div>

      </div>

      {/* Table */}

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead className="bg-gray-50">

            <tr>

              <th className="p-4 text-left">
                Image
              </th>

              <th className="p-4 text-left">
                Name
              </th>

              <th className="p-4 text-left">
                Slug
              </th>

              <th className="p-4 text-left">
                Status
              </th>

              <th className="p-4 text-center">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {loading && (

              <tr>

                <td
                  colSpan={5}
                  className="p-10 text-center"
                >
                  Loading...
                </td>

              </tr>

            )}

            {!loading &&
              filteredCategories.length === 0 && (

                <tr>

                  <td
                    colSpan={5}
                    className="p-10 text-center text-gray-500"
                  >
                    No Categories Found
                  </td>

                </tr>

              )}

            {!loading &&
              filteredCategories.map((item) => (

                <tr
                  key={item._id}
                  className="border-t hover:bg-gray-50"
                >

                  <td className="p-4">

                    <div className="relative h-16 w-16 overflow-hidden rounded-lg border">

                      <Image
                        src={
                          item.image && item.image.includes("res.cloudinary.com")
                            ? item.image
                            : "/placeholder.png"
                        }
                        alt={item.name}
                        fill
                        className="object-cover"
                      />

                    </div>

                  </td>

                  <td className="p-4 font-medium">
                    {item.name}
                  </td>

                  <td className="p-4 text-gray-500">
                    {item.slug}
                  </td>

                  <td className="p-4">

                    {item.status ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                        Inactive
                      </span>
                    )}

                  </td>

                  <td className="p-4">

                    <div className="flex justify-center gap-2">

                      <button
                        onClick={() => onEdit(item)}
                        className="rounded-lg bg-blue-50 p-2 hover:bg-blue-100"
                      >
                        <Pencil
                          size={18}
                          className="text-blue-600"
                        />
                      </button>

                      <button
                        onClick={() =>
                          deleteCategory(item._id)
                        }
                        className="rounded-lg bg-red-50 p-2 hover:bg-red-100"
                      >
                        <Trash2
                          size={18}
                          className="text-red-600"
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