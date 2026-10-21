"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Search } from "lucide-react";
import CategoryImage from "@/app/components/category/CategoryImage";

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
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        const res = await fetch("/api/categories", {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(`Failed to load categories (${res.status}).`);
        }

        const text = await res.text();
        const data = text ? JSON.parse(text) : [];
        if (active) {
          setCategories(Array.isArray(data) ? data : []);
          setLoadError("");
        }
      } catch (error) {
        console.error("Failed to load categories:", error);
        if (active) setLoadError("Could not load categories. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadCategories();
    return () => {
      active = false;
    };
  }, [refresh]);

  async function deleteCategory(id: string) {
    const confirmDelete = window.confirm(
      "Delete this category?"
    );

    if (!confirmDelete) return;

    try {
      const deleteResponse = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });
      if (!deleteResponse.ok) {
        const result = (await deleteResponse.json()) as { message?: string };
        throw new Error(result.message ?? "Failed to delete category.");
      }

      const response = await fetch("/api/categories", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to refresh categories (${response.status}).`);
      }
      const data = (await response.json()) as Category[];
      setCategories(data);
      setLoadError("");
    } catch (error) {
      console.error("Failed to delete category:", error);
      window.alert(
        error instanceof Error ? error.message : "Failed to delete category."
      );
    }
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

            {!loading && loadError && (
              <tr>
                <td colSpan={5} className="p-10 text-center text-red-700">
                  {loadError}
                </td>
              </tr>
            )}

            {!loading &&
              !loadError &&
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

                      <CategoryImage
                        src={item.image}
                        alt={item.name}
                        sizes="64px"
                        className="object-cover"
                        fallbackClassName="text-[9px] text-gray-500"
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
                        type="button"
                        onClick={() => onEdit(item)}
                        title={`Edit ${item.name}`}
                        aria-label={`Edit ${item.name}`}
                        className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-[#2867b2] bg-[#2867b2] px-2.5 text-xs font-semibold text-white transition hover:border-[#1e4f88] hover:bg-[#1e4f88] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2867b2]"
                      >
                        <Pencil size={14} aria-hidden="true" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteCategory(item._id)
                        }
                        title={`Delete ${item.name}`}
                        aria-label={`Delete ${item.name}`}
                        className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-[#a33b3b] bg-[#a33b3b] px-2.5 text-xs font-semibold text-white transition hover:border-[#812d2d] hover:bg-[#812d2d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a33b3b]"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        <span>Delete</span>
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