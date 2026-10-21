import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  detail?: string;
  color?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  detail,
  color = "bg-primary/10 text-primary",
}: StatCardProps) {
  return (
    <div className="group min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:p-5">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold text-slate-500 sm:text-xs">
            {title}
          </p>
          <h2 className="mt-2 truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {value}
          </h2>
        </div>
        <div className={`${color} flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 sm:size-11`}>
          {icon}
        </div>
      </div>
      {detail && (
        <p className="mt-3 truncate border-t border-slate-100 pt-2.5 text-[10px] font-medium text-slate-500 sm:text-[11px]">
          {detail}
        </p>
      )}
    </div>
  );
}