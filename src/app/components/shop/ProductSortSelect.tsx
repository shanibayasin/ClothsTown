"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function ProductSortSelect({
  value,
  options,
}: {
  value: string;
  options: [string, string][];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
      <span>Sort by</span>
      <select
        value={value}
        onChange={(event) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("sort", event.target.value);
          params.set("page", "1");
          router.push(`${pathname}?${params.toString()}`);
        }}
        className="min-h-9 rounded-md border border-slate-200 bg-white px-3 text-xs"
      >
        {options.map(([optionValue, label]) => (
          <option key={optionValue} value={optionValue}>{label}</option>
        ))}
      </select>
    </label>
  );
}
