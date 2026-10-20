"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Pencil,
  Trash2,
  Search,
  Eye,
  Copy,
} from "lucide-react";

interface Collection {
  _id: string;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  image: string;
  status: boolean;
  createdAt?: string;
}

interface Props {
  onEdit: (collection: Collection) => void;
  refresh: number;
}

export default function CollectionTable({
  onEdit,
  refresh,
}: Props) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollections();
  }, [refresh]);

  async function fetchCollections() {
    setLoading(true);

    const res = await fetch("/api/collections", {
      cache: "no-store",
    });

    const data = await res.json();

    setCollections(data);
    setLoading(false);
  }

  async function deleteCollection(id: string) {
    if (!window.confirm("Delete this collection?")) return;

    await fetch(`/api/collections/${id}`, {
      method: "DELETE",
    });

    fetchCollections();
  }

  async function copySlug(slug: string) {
    await navigator.clipboard.writeText(slug);
    alert("Slug copied.");
  }

  const filteredCollections = useMemo(() => {
    return collections.filter((item) =>
      item.title
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [collections, search]);

  return (
    <div className="rounded-2xl border bg-white shadow-sm">

      {/* Header */}

      <div className="flex items-center justify-between border-b p-6">

        <div>
          <h2 className="text-xl font-semibold">
            Collections
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Manage all storefront collections
          </p>
        </div>

        <div className="relative w-80">

          <Search
            size={18}
            className="absolute left-3 top-3 text-gray-400"
          />

          <input
            placeholder="Search collections..."
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
                Title
              </th>

              <th className="p-4 text-left">
                Slug
              </th>

              <th className="p-4 text-left">
                Subtitle
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
                  colSpan={6}
                  className="p-10 text-center"
                >
                  Loading...
                </td>

              </tr>

            )}

            {!loading &&
              filteredCollections.length === 0 && (

                <tr>

                  <td
                    colSpan={6}
                    className="p-10 text-center text-gray-500"
                  >
                    No collections found.
                  </td>

                </tr>

              )}

            {!loading &&
              filteredCollections.map((item) => (

                <tr
                  key={item._id}
                  className="border-t hover:bg-gray-50"
                >

                  <td className="p-4">

                    <div className="relative h-16 w-16 overflow-hidden rounded-xl">

                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />

                    </div>

                  </td>

                  <td className="p-4 font-semibold">
                    {item.title}
                  </td>

                  <td className="p-4">

                    <div className="flex items-center gap-2">

                      <span className="rounded bg-gray-100 px-2 py-1 text-xs">
                        {item.slug}
                      </span>

                      <button
                        onClick={() =>
                          copySlug(item.slug)
                        }
                      >
                        <Copy
                          size={15}
                          className="text-gray-500 hover:text-[#6f1d46]"
                        />
                      </button>

                    </div>

                  </td>

                  <td className="p-4 text-gray-600">
                    {item.subtitle}
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

                      <Link
                        href={`/collections/${item.slug}`}
                        target="_blank"
                        className="rounded-lg bg-emerald-50 p-2 hover:bg-emerald-100"
                      >
                        <Eye
                          size={18}
                          className="text-emerald-600"
                        />
                      </Link>

                      <button
                        onClick={() =>
                          onEdit(item)
                        }
                        className="rounded-lg bg-blue-50 p-2 hover:bg-blue-100"
                      >
                        <Pencil
                          size={18}
                          className="text-blue-600"
                        />
                      </button>

                      <button
                        onClick={() =>
                          deleteCollection(item._id)
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