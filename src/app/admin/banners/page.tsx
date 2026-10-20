"use client";

import { useState } from "react";
import BannerForm from "../components/banner/BannerForm";
import BannerTable from "../components/banner/BannerTable";

export default function BannersPage() {
  const [refresh, setRefresh] = useState(0);
  const [editing, setEditing] = useState<any>(null);

  return (
    <div className="space-y-8">
      <BannerForm
        editing={editing}
        onSuccess={() => {
          setRefresh((prev) => prev + 1);
          setEditing(null);
        }}
      />

      <BannerTable
        refresh={refresh}
        onEdit={setEditing}
      />
    </div>
  );
}