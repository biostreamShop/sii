"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  Calculator,
  FileText,
  AlertCircle,
} from "lucide-react";
import KPICard from "@/components/KPICard";
import YearMonthFilter from "@/components/YearMonthFilter";
import {
  SalesVsPurchasesChart,
  IvaTrendChart,
  DocumentTypeChart,
  YTDComparisonChart,
} from "@/components/Charts";
import Link from "next/link";

interface DashboardData {
  kpis: {
    totalVentas: number;
    totalCompras: number;
    ivaDebito: number;
    ivaCredito: number;
    ivaPagar: number;
    cantidadDocumentos: number;
  };
  monthlyData: Array<{
    month: string;
    ventas: number;
    compras: number;
    iva: number;
  }>;
  documentTypes: {
    ventas: Array<{ name: string; value: number }>;
    compras: Array<{ name: string; value: number }>;
  };
  ytdComparison: Array<{
    month: string;
    actual: number;
    anterior: number;
  }>;
  hasData: boolean;
}

export default function DashboardContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const year = searchParams.get("year") || new Date().getFullYear().toString();
  const month = searchParams.get("month") || "0";

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/dashboard?year=${year}&month=${month}`
        );
        if (!response.ok) throw new Error("Error al cargar datos");
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [year, month]);

  if (loading) {
    return (
      <div className="p-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!data?.hasData) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
          <FileText className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-blue-800 mb-2">
            No hay datos cargados
          </h2>
          <p className="text-blue-600 mb-6">
            Importa tus archivos CSV de ventas y compras para comenzar a ver las
            métricas.
          </p>
          <Link
            href="/importar"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <TrendingUp className="w-5 h-5" />
            Ir a Importar CSV
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
          Dashboard - Resumen {month !== "0" ? `Mes ${month}` : "Anual"} {year}
        </h1>
        <YearMonthFilter />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <KPICard
          title="Total Ventas"
          value={data.kpis.totalVentas}
          icon={TrendingUp}
          color="blue"
        />
        <KPICard
          title="Total Compras"
          value={data.kpis.totalCompras}
          icon={TrendingDown}
          color="green"
        />
        <KPICard
          title="IVA Débito"
          value={data.kpis.ivaDebito}
          icon={Receipt}
          color="amber"
        />
        <KPICard
          title="IVA Crédito"
          value={data.kpis.ivaCredito}
          icon={Receipt}
          color="purple"
        />
        <KPICard
          title="IVA a Pagar"
          value={data.kpis.ivaPagar}
          icon={Calculator}
          color={data.kpis.ivaPagar >= 0 ? "red" : "green"}
        />
        <KPICard
          title="Documentos"
          value={data.kpis.cantidadDocumentos}
          icon={FileText}
          format="number"
          color="blue"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SalesVsPurchasesChart data={data.monthlyData} />
        <IvaTrendChart data={data.monthlyData} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DocumentTypeChart
          data={data.documentTypes.ventas}
          title="Tipos de Documentos - Ventas"
        />
        <DocumentTypeChart
          data={data.documentTypes.compras}
          title="Tipos de Documentos - Compras"
        />
        <YTDComparisonChart data={data.ytdComparison} />
      </div>
    </div>
  );
}
