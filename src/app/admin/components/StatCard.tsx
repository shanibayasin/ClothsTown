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
  color = "bg-[#6B1E4A]",
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 p-6">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-gray-500">
            {title}
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            {value}
          </h2>

        </div>

        <div className={`${color} h-14 w-14 rounded-xl flex items-center justify-center text-white`}>
          {icon}
        </div>

      </div>

    </div>
  );
}