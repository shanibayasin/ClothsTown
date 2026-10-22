"use client";

import { useEffect, useState } from "react";
import ProductForm from "../components/products/ProductForm";
import ProductTable from "../components/products/ProductTable";

export default function ProductsPage() {
  const [editing, setEditing] = useState<any>(null);
  const [refresh, setRefresh] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);

  useEffect(() => {
    async function fetchOptions() {
      try {
        const [categoriesRes, collectionsRes] = await Promise.all([
          fetch("/api/categories", { cache: "no-store" }),
          fetch("/api/collections", { cache: "no-store" }),
        ]);

        const [categoriesData, collectionsData] = await Promise.all([
          categoriesRes.json(),
          collectionsRes.json(),
        ]);

        setCategories(categoriesData || []);
        setCollections(collectionsData || []);
      } catch (error) {
        console.error(error);
      }
    }

    fetchOptions();
  }, []);

  return (
    <div className="space-y-3">

      <ProductForm
        editing={editing}
        categories={categories}
        collections={collections}
        onSuccess={() => {
          setEditing(null);
          setRefresh((p) => p + 1);
        }}
      />

      <ProductTable
        refresh={refresh}
        onEdit={setEditing}
      />

    </div>
  );
}