"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface Props {
  data: {
    _id: {
      day: number;
    };
    revenue: number;
  }[];
}

const days = [
  "",
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

export default function WeeklySalesChart({
  data,
}: Props) {
  const chartData = data.map((item) => ({
    day: days[item._id.day],
    revenue: item.revenue,
  }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" />
          <XAxis dataKey="day" stroke="#737373" />
          <YAxis stroke="#737373" />
          <Tooltip contentStyle={{ borderColor: "#d4d4d4", borderRadius: 8 }} />
          <Bar
            dataKey="revenue"
            fill="#111111"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}