"use client";

import { useState } from "react";

import CategoryForm from "../components/categories/CategoryForm";
import CategoryTable from "../components/categories/CategoryTable";

export default function CategoriesPage() {

  const [refresh, setRefresh] = useState(0);

  const [editing, setEditing] = useState<any>(null);

  return (

    <div className="space-y-8">

      <CategoryForm
        editing={editing}
        onSuccess={() => {
          setRefresh((prev) => prev + 1);
          setEditing(null);
        }}
      />

      <CategoryTable
        refresh={refresh}
        onEdit={setEditing}
      />

    </div>

  );
}