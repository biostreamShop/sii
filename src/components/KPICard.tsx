"use client";

import { LucideIcon } from "lucide-react";
import { formatCLP } from "@/lib/csv-utils";

interface KPICardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: number;
  format?: "currency" | "number";
  color?: "blue" | "green" | "red" | "amber" | "purple";
}

const colorClasses = {
  blue: "bg-blue-50 text-blue-600 border-blue-200",
  green: "bg-green-50 text-green-600 border-green-200",
  red: "bg-red-50 text-red-600 border-red-200",
  amber: "bg-amber-50 text-amber-600 border-amber-200",
  purple: "bg-purple-50 text-purple-600 border-purple-200",
};

const iconBgClasses = {
  blue: "bg-blue-100",
  green: "bg-green-100",
  red: "bg-red-100",
  amber: "bg-amber-100",
  purple: "bg-purple-100",
};

export default function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  format = "currency",
  color = "blue",
}: KPICardProps) {
  const formattedValue =
    format === "currency"
      ? formatCLP(value)
      : new Intl.NumberFormat("es-CL").format(value);

  return (
    <div className={`rounded-xl border p-6 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{formattedValue}</p>
          {trend !== undefined && (
            <p
              className={`text-sm mt-1 ${
                trend >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend >= 0 ? "+" : ""}
              {trend.toFixed(1)}% vs mes anterior
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${iconBgClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
