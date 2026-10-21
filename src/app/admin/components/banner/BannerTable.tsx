"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Pencil, Trash2, Search, Loader2 } from "lucide-react";
import type { Banner as BannerFormData } from "./BannerForm";

interface Banner extends Omit<BannerFormData, "_id"> {
  _id: string;
}

interface Props {
  banners?: Banner[];
  refresh?: number;
  onEdit: (banner: Banner) => void;
  onRefresh?: () => void;
}

export default function BannerTable({
  banners,
  refresh,
  onEdit,
  onRefresh,
}: Props) {
  const [loadedItems, setItems] = useState<Banner[]>([]);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!banners);
  const items = banners ?? loadedItems;

  useEffect(() => {
    if (banners) return;

    let isMounted = true;
    const loadBanners = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/banner");
        if (!res.ok) throw new Error("Failed to load banners");
        const data = await res.json();
        if (isMounted) setItems(data);
      } catch (err) {
        console.error("Banner fetch error:", err);
        if (isMounted) setItems([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadBanners();

    return () => {
      isMounted = false;
    };
  }, [banners, refresh]);

  async function deleteBanner(id: string) {
    if (!window.confirm("Are you sure you want to delete this banner configuration permanently?")) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await fetch(`/api/banner/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete banner operational asset");
      
      // Trigger dynamic hydration on the parent layer
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Banner deletion request error:", err);
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = useMemo(() => {
    return items.filter((item) =>
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.subtitle?.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  return (
    <div className="w-full">
      {!banners && loading && (
        <div className="flex items-center justify-center border-b p-6 text-sm text-slate-500">
          <Loader2 size={16} className="mr-2 animate-spin" />
          Loading banner configuration...
        </div>
      )}

      {/* Table Local Header Options Layer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b p-5 gap-4 bg-slate-50/40">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Active Hero Slots
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Overview of live visual arrays on the layout interface
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="absolute left-3.5 top-3.5 text-gray-400"
          />
          <input
            placeholder="Filter arrays by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-[#6f1d46] transition bg-white"
          />
        </div>
      </div>

      {/* Main Table Interface Layer */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] table-auto border-collapse">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500 border-b">
              <th className="p-4 pl-6 w-32">Preview Image</th>
              <th className="p-4">Title Context</th>
              <th className="p-4">Subtitle Line</th>
              <th className="p-4 w-28">Status</th>
              <th className="p-4 w-28 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-12 text-center text-sm font-medium text-slate-400 bg-white"
                >
                  No banner layers match your current filter parameters.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item._id}
                  className="hover:bg-[#faf5f7]/30 transition duration-150"
                >
                  {/* Visual Image Render */}
                  <td className="p-4 pl-6">
                    <div className="relative h-12 w-20 overflow-hidden rounded-lg border border-slate-100 bg-slate-50 shadow-sm">
                      <Image
                        src={item.image}
                        alt={item.title || "Banner Layout Preview"}
                        fill
                        className="object-cover"
                        sizes="80px"
                        unoptimized
                      />
                    </div>
                  </td>

                  {/* Title */}
                  <td className="p-4 font-semibold text-slate-900 max-w-[200px] truncate">
                    {item.title}
                  </td>

                  {/* Subtitle */}
                  <td className="p-4 text-slate-500 max-w-[250px] truncate">
                    {item.subtitle || <span className="text-slate-300 italic">None</span>}
                  </td>

                  {/* Status Badges */}
                  <td className="p-4">
                    {item.status ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
                        Live Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
                        Hidden Slot
                      </span>
                    )}
                  </td>

                  {/* Action Handlers Panel */}
                  <td className="p-4">
                    <div className="flex justify-center items-center gap-2">
                      <button
                        onClick={() => onEdit(item)}
                        title="Edit Layer Data"
                        className="rounded-xl border border-slate-100 bg-white p-2 text-slate-600 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 transition"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => deleteBanner(item._id)}
                        disabled={deletingId === item._id}
                        title="Delete Configuration"
                        className="rounded-xl border border-slate-100 bg-white p-2 text-slate-600 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-40"
                      >
                        {deletingId === item._id ? (
                          <Loader2 size={15} className="animate-spin text-red-600" />
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}