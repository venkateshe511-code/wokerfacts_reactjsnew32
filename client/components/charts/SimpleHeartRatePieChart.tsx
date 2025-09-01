import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { ChartContainer } from "@/components/ui/chart";

interface MetricPieChartProps {
  value: number | string;
  label: string;
  color: string;
  maxValue?: number;
  unit?: string;
  isPercentage?: boolean;
}

export default function MetricPieChart({
  value,
  label,
  color,
  maxValue = 100,
  unit = "",
  isPercentage = false,
}: MetricPieChartProps) {
  // Convert value to number if it's a string
  const numericValue =
    typeof value === "string" ? parseFloat(value) || 0 : value;

  // Calculate percentage for the pie chart
  let percentage;
  if (isPercentage) {
    percentage = Math.min(numericValue, 100);
  } else {
    percentage = Math.min((numericValue / maxValue) * 100, 100);
  }

  const data = [
    { name: "Value", value: percentage },
    { name: "Remaining", value: 100 - percentage },
  ];

  const chartConfig = {
    value: {
      label: label,
      color: color,
    },
    remaining: {
      label: "Remaining",
      color: "#e5e7eb",
    },
  };

  // Format display value
  const displayValue =
    typeof value === "string"
      ? value
      : isPercentage
        ? `${numericValue.toFixed(1)}%`
        : unit
          ? `${numericValue}${unit}`
          : numericValue.toString();

  return (
    <div className="w-24 h-24 mx-auto">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={20}
            outerRadius={40}
            startAngle={90}
            endAngle={450}
            dataKey="value"
          >
            <Cell fill={color} />
            <Cell fill="#e5e7eb" />
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="text-center mt-1">
        <div className="text-xs font-semibold" style={{ color }}>
          {displayValue}
        </div>
        <div className="text-xs text-gray-600">{label}</div>
      </div>
    </div>
  );
}
