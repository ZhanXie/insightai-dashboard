"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

interface DocumentsOverTimeChartProps {
  data: Array<{ date: string; count: number }>;
}

function DocumentsOverTimeChart({ data }: DocumentsOverTimeChartProps) {
  const [aggregation, setAggregation] = useState<"day" | "week" | "month">("day");

  const aggregatedData = data.reduce(
    (acc, item) => {
      let key: string;
      const date = new Date(item.date);

      if (aggregation === "day") {
        key = item.date;
      } else if (aggregation === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }

      acc[key] = (acc[key] || 0) + item.count;
      return acc;
    },
    {} as Record<string, number>
  );

  const chartData = Object.entries(aggregatedData)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["day", "week", "month"] as const).map((agg) => (
          <button
            key={agg}
            onClick={() => setAggregation(agg)}
            className={`rounded px-3 py-1 text-sm ${
              aggregation === agg
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {agg.charAt(0).toUpperCase() + agg.slice(1)}
          </button>
        ))}
      </div>
      {chartData.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-gray-500">
          Upload documents to see trends
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3B82F6"
              name="Documents"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

interface ChatActivityChartProps {
  data: Array<{ date: string; count: number }>;
}

function ChatActivityChart({ data }: ChatActivityChartProps) {
  return data.length === 0 ? (
    <div className="flex h-64 items-center justify-center text-gray-500">
      Start chatting to see activity
    </div>
  ) : (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" fill="#10B981" name="Messages" />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface FormatDistributionChartProps {
  data: Array<{ format: string; count: number }>;
}

function FormatDistributionChart({ data }: FormatDistributionChartProps) {
  return data.length === 0 ? (
    <div className="flex h-64 items-center justify-center text-gray-500">
      No document format data
    </div>
  ) : (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data.map((d) => ({ name: d.format, value: d.count }))}
          cx="50%"
          cy="50%"
          labelLine
          label={({ name, percent }) =>
            `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
          }
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export {
  DocumentsOverTimeChart,
  ChatActivityChart,
  FormatDistributionChart,
};
