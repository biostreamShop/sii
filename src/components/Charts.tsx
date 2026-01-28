"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatCLP } from "@/lib/csv-utils";

const COLORS = [
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#84CC16", // lime
];

interface MonthlyData {
  month: string;
  ventas?: number;
  compras?: number;
  iva?: number;
  [key: string]: string | number | undefined;
}

interface SalesVsPurchasesChartProps {
  data: MonthlyData[];
}

export function SalesVsPurchasesChart({ data }: SalesVsPurchasesChartProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">Ventas vs Compras (Mensual)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
          <Tooltip
            formatter={(value) => formatCLP(Number(value) || 0)}
            labelFormatter={(label) => `Mes: ${label}`}
          />
          <Legend />
          <Bar dataKey="ventas" name="Ventas" fill="#3B82F6" />
          <Bar dataKey="compras" name="Compras" fill="#10B981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface IvaTrendChartProps {
  data: MonthlyData[];
}

export function IvaTrendChart({ data }: IvaTrendChartProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">IVA a Pagar (Tendencia)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
          <Tooltip
            formatter={(value) => formatCLP(Number(value) || 0)}
            labelFormatter={(label) => `Mes: ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="iva"
            name="IVA a Pagar"
            stroke="#F59E0B"
            strokeWidth={2}
            dot={{ fill: "#F59E0B" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DocumentTypeChartProps {
  data: { name: string; value: number }[];
  title: string;
}

export function DocumentTypeChart({ data, title }: DocumentTypeChartProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name} (${((percent || 0) * 100).toFixed(0)}%)`
            }
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => new Intl.NumberFormat("es-CL").format(Number(value) || 0)}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface YTDComparisonChartProps {
  data: { month: string; actual: number; anterior: number }[];
}

export function YTDComparisonChart({ data }: YTDComparisonChartProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">Comparación YTD</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
          <Tooltip
            formatter={(value) => formatCLP(Number(value) || 0)}
            labelFormatter={(label) => `Mes: ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="actual"
            name="Año Actual"
            stroke="#3B82F6"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="anterior"
            name="Año Anterior"
            stroke="#9CA3AF"
            strokeWidth={2}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
