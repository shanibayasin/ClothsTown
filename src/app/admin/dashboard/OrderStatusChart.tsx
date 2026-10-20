"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Props {
  analytics: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
}

export default function OrderStatusChart({
  analytics,
}: Props) {
  const data = [
    {
      name: "Pending",
      value: analytics.pending,
    },
    {
      name: "Processing",
      value: analytics.processing,
    },
    {
      name: "Shipped",
      value: analytics.shipped,
    },
    {
      name: "Delivered",
      value: analytics.delivered,
    },
    {
      name: "Cancelled",
      value: analytics.cancelled,
    },
  ];

  const COLORS = [
    "#facc15",
    "#3b82f6",
    "#8b5cf6",
    "#22c55e",
    "#ef4444",
  ];

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            outerRadius={100}
            dataKey="value"
            label
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={COLORS[index]}
              />
            ))}
          </Pie>

          <Tooltip />

          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}