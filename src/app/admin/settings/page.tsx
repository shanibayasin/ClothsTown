"use client";

import { useEffect, useState } from "react";
import { Database, Image as ImageIcon, ShieldCheck } from "lucide-react";

interface ServiceStatus {
  database: string;
  adminAuthentication: string;
  imageHosting: string;
}

const services = [
  { key: "database", label: "MongoDB", Icon: Database },
  { key: "adminAuthentication", label: "Admin authentication", Icon: ShieldCheck },
  { key: "imageHosting", label: "Cloudinary image hosting", Icon: ImageIcon },
] as const;

export default function SettingsPage() {
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const response = await fetch("/api/admin/settings", { cache: "no-store" });
        const result = (await response.json()) as ServiceStatus & { message?: string };
        if (!response.ok) throw new Error(result.message || "Could not load service status.");
        if (active) setStatus(result);
      } catch (requestError) {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Could not load service status."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadStatus();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-sm text-neutral-500">Deployment configuration</p>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900">Settings</h1>
      </header>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-neutral-900">Connected services</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Configuration values are managed in the hosting environment and are never displayed here.
          </p>
        </div>
        {error ? (
          <p role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {services.map(({ key, label, Icon }) => {
              const value = status?.[key];
              const isConfigured = value === "connected" || value === "configured";
              return (
                <li key={key} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <span className="flex items-center gap-3 text-sm font-medium text-neutral-800">
                    <Icon size={17} className="text-neutral-500" aria-hidden="true" />
                    {label}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    loading
                      ? "bg-neutral-100 text-neutral-500"
                      : isConfigured
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                  }`}>
                    {loading ? "Checking" : value ?? "Unavailable"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
