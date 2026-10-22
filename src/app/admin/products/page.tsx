"use client";

import { useEffect, useState } from "react";
import ProductForm from "../components/products/ProductForm";
import ProductTable, { type AdminProduct } from "../components/products/ProductTable";

interface ProductCategoryOption {
  _id: string;
  name: string;
}

interface ProductCollectionOption {
  _id: string;
  title: string;
}

export default function ProductsPage() {
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [categories, setCategories] = useState<ProductCategoryOption[]>([]);
  const [collections, setCollections] = useState<ProductCollectionOption[]>([]);

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

        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setCollections(Array.isArray(collectionsData) ? collectionsData : []);
      } catch (error) {
        console.error(error);
      }
    }

    fetchOptions();
  }, []);

  return (
    <div className="space-y-3">

      <ProductForm
        key={editing?._id ?? "new"}
        editing={editing}
        categories={categories}
        collections={collections}
        onSuccess={() => {
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