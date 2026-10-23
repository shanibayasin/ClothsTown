"use client";

import { useState, type ComponentProps } from "react";
import CollectionForm from "../components/CollectionForm";
import CollectionTable from "../components/CollectionTable";

export default function CollectionsPage() {
  const [refresh, setRefresh] = useState(0);
  const [editing, setEditing] =
    useState<ComponentProps<typeof CollectionForm>["editing"]>(null);

  return (
    <div className="space-y-8">

      <CollectionForm
        key={editing?._id ?? "new"}
        editing={editing}
        onSuccess={() => {
          setRefresh((prev) => prev + 1);
          setEditing(null);
        }}
      />

      <CollectionTable
        refresh={refresh}
        onEdit={setEditing}
      />

    </div>
  );
}