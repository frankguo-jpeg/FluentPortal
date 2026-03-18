"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TrendChartProps {
  data: Array<{ week: string; value: number | null }>;
  label: string;
  unit: string;
  color?: string;
}

export function TrendChart({ data, label, unit, color = "#1e40af" }: TrendChartProps) {
  const filteredData = data.filter((d) => d.value !== null);

  if (filteredData.length === 0) {
    return (
      <div className="bg-slate-50 rounded-lg p-6 text-center">
        <p className="text-sm text-slate-500">No data for {label}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4">
      <h4 className="text-sm font-medium text-slate-700 mb-3">{label}</h4>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [`${value}${unit === "%" ? "%" : ` ${unit}`}`, label]}
            contentStyle={{ fontSize: 12 }}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
