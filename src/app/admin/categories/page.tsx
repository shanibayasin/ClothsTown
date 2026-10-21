"use client";

import { useState } from "react";

import CategoryForm from "../components/categories/CategoryForm";
import CategoryTable from "../components/categories/CategoryTable";

interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
  status: boolean;
}

export default function CategoriesPage() {

  const [refresh, setRefresh] = useState(0);

  const [editing, setEditing] = useState<Category | null>(null);

  function handleEdit(category: Category) {
    setEditing(category);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (

    <div className="space-y-8">

      <CategoryForm
        key={editing?._id ?? "new-category"}
        editing={editing}
        onCancelEdit={() => setEditing(null)}
        onSuccess={() => {
          setRefresh((prev) => prev + 1);
          setEditing(null);
        }}
      />

      <CategoryTable
        refresh={refresh}
        onEdit={handleEdit}
      />

    </div>

  );
}