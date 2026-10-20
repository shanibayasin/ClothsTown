"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  analytics: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
}

const statuses = [
  { name: "Pending", key: "pending", color: "#171717" },
  { name: "Processing", key: "processing", color: "#404040" },
  { name: "Shipped", key: "shipped", color: "#737373" },
  { name: "Delivered", key: "delivered", color: "#a3a3a3" },
  { name: "Cancelled", key: "cancelled", color: "#d4d4d4" },
] as const;

export default function OrderStatusChart({ analytics }: Props) {
  const total = statuses.reduce((sum, status) => sum + analytics[status.key], 0);
  const data = statuses.map(({ name, key, color }) => ({
    name,
    value: analytics[key],
    color,
  }));

  return (
    <div className="flex min-h-[210px] flex-col items-center justify-center gap-2 sm:flex-row sm:gap-4">
      <div className="relative size-[170px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={76}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((item) => (
                <Cell key={item.name} fill={item.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderColor: "#d4d4d4", borderRadius: 8, fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <strong className="text-xl font-bold text-neutral-900">{total.toLocaleString()}</strong>
          <span className="text-[10px] text-neutral-500">Total Orders</span>
        </div>
      </div>

      <ul className="grid w-full grid-cols-2 gap-x-3 gap-y-2 text-[10px] sm:grid-cols-1 sm:gap-y-2.5 sm:text-xs">
        {data.map((item) => (
          <li key={item.name} className="flex min-w-0 items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate text-neutral-600">{item.name}</span>
            <span className="shrink-0 font-medium text-neutral-900">
              {item.value}{" "}
              <span className="text-neutral-400">
                ({total ? Math.round((item.value / total) * 100) : 0}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
