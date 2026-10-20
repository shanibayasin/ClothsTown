import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  color = "bg-black",
}: StatCardProps) {
  return (
    <div className="min-w-0 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-neutral-500 sm:text-xs">
            {title}
          </p>
          <h2 className="mt-2 truncate text-lg font-bold text-neutral-900 sm:text-xl">
            {value}
          </h2>
        </div>
        <div className={`${color} flex size-9 shrink-0 items-center justify-center rounded-lg text-white sm:size-10`}>
          {icon}
        </div>
      </div>
    </div>
  );
}