"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  data: {
    date: string;
    revenue: number;
  }[];
}

const currency = (value: number) => `Rs. ${value.toLocaleString()}`;

export default function SalesChart({ data }: Props) {
  return (
    <div className="h-[250px] w-full sm:h-[290px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="dashboard-revenue-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#525252" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#525252" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#737373", fontSize: 11 }}
            tickMargin={10}
            interval={0}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#737373", fontSize: 10 }}
            tickFormatter={currency}
            width={78}
          />
          <Tooltip
            formatter={(value) => [currency(Number(value)), "Revenue"]}
            contentStyle={{ borderColor: "#d4d4d4", borderRadius: 8, fontSize: 12 }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#171717"
            strokeWidth={2.5}
            fill="url(#dashboard-revenue-fill)"
            activeDot={{ r: 4, fill: "#171717" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
