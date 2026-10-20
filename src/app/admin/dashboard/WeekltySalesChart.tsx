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
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Bar
            dataKey="revenue"
            fill="#6f1d46"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}