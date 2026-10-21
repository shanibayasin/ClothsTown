"use client";

import { useState } from "react";
import BannerForm, { type Banner } from "../components/banner/BannerForm";
import BannerTable from "../components/banner/BannerTable";

export default function BannersPage() {
  const [refresh, setRefresh] = useState(0);
  const [editing, setEditing] = useState<Banner | null>(null);

  return (
    <div className="space-y-8">
      <BannerForm
        key={editing?._id ?? "new"}
        editing={editing}
        onSuccess={() => {
          setRefresh((prev) => prev + 1);
          setEditing(null);
        }}
        onClose={() => setEditing(null)}
      />

      <BannerTable
        refresh={refresh}
        onEdit={setEditing}
        onRefresh={() => setRefresh((prev) => prev + 1)}
      />
    </div>
  );
}