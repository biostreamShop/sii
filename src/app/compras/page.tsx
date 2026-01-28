"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShoppingCart, Download, FileText } from "lucide-react";
import DataTable from "@/components/DataTable";
import YearMonthFilter from "@/components/YearMonthFilter";
import KPICard from "@/components/KPICard";
import Link from "next/link";

interface Transaction {
  id: number;
  tipoDocumento: string;
  folio: string;
  fechaEmision: string;
  rut: string;
  razonSocial: string;
  montoExento: number;
  montoNeto: number;
  montoIva: number;
  montoTotal: number;
  reclassified: boolean;
}

interface TransactionResponse {
  transactions: Transaction[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  filters: {
    availableYears: number[];
    documentTypes: { name: string; count: number }[];
  };
}

function ComprasContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<TransactionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tipoDocFilter, setTipoDocFilter] = useState("");

  const year = searchParams.get("year") || new Date().getFullYear().toString();
  const month = searchParams.get("month") || "0";
  const page = parseInt(searchParams.get("page") || "1");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          categoria: "compra",
          year,
          page: page.toString(),
          pageSize: "50",
        });
        if (month !== "0") params.append("month", month);
        if (tipoDocFilter) params.append("tipoDocumento", tipoDocFilter);

        const response = await fetch(`/api/transactions?${params}`);
        if (!response.ok) throw new Error("Error al cargar datos");
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [year, month, page, tipoDocFilter]);

  const handleExport = () => {
    if (!data) return;

    const headers = [
      "Fecha",
      "Tipo Doc",
      "Folio",
      "RUT",
      "Razón Social",
      "Exento",
      "Neto",
      "IVA",
      "Total",
    ];
    const rows = data.transactions.map((t) => [
      new Date(t.fechaEmision).toLocaleDateString("es-CL"),
      t.tipoDocumento,
      t.folio,
      t.rut,
      t.razonSocial,
      t.montoExento,
      t.montoNeto,
      t.montoIva,
      t.montoTotal,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `compras_${year}_${month || "anual"}.csv`;
    link.click();
  };

  const columns = [
    { key: "fechaEmision", label: "Fecha", type: "date" as const },
    { key: "tipoDocumento", label: "Tipo Doc" },
    { key: "folio", label: "Folio" },
    { key: "rut", label: "RUT" },
    { key: "razonSocial", label: "Proveedor" },
    { key: "montoNeto", label: "Neto", type: "currency" as const },
    { key: "montoIva", label: "IVA", type: "currency" as const },
    { key: "montoTotal", label: "Total", type: "currency" as const },
  ];

  // Calculate totals
  const totals = data?.transactions.reduce(
    (acc, t) => ({
      neto: acc.neto + t.montoNeto,
      iva: acc.iva + t.montoIva,
      total: acc.total + t.montoTotal,
    }),
    { neto: 0, iva: 0, total: 0 }
  ) || { neto: 0, iva: 0, total: 0 };

  if (!data?.transactions.length && !loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Compras</h1>
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <FileText className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-green-800 mb-2">
            No hay compras registradas
          </h2>
          <p className="text-green-600 mb-6">
            Importa tu archivo CSV de compras para ver los registros aquí.
          </p>
          <Link
            href="/importar"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            Ir a Importar CSV
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compras</h1>
          <p className="text-gray-600 mt-1">
            {data?.pagination.total || 0} registros encontrados
          </p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <YearMonthFilter availableYears={data?.filters.availableYears} />
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KPICard
          title="Total Neto"
          value={totals.neto}
          icon={ShoppingCart}
          color="green"
        />
        <KPICard
          title="IVA Crédito"
          value={totals.iva}
          icon={ShoppingCart}
          color="purple"
        />
        <KPICard
          title="Total Compras"
          value={totals.total}
          icon={ShoppingCart}
          color="blue"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo Documento
            </label>
            <select
              value={tipoDocFilter}
              onChange={(e) => setTipoDocFilter(e.target.value)}
              className="block w-48 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            >
              <option value="">Todos</option>
              {data?.filters.documentTypes.map((dt) => (
                <option key={dt.name} value={dt.name}>
                  {dt.name} ({dt.count})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border animate-pulse">
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data?.transactions || []}
          pageSize={50}
          onExport={handleExport}
        />
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("page", pageNum.toString());
                  router.push(`?${params}`);
                }}
                className={`px-3 py-1 rounded ${
                  page === pageNum
                    ? "bg-blue-600 text-white"
                    : "bg-white border hover:bg-gray-50"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ComprasPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32 mb-8" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      }
    >
      <ComprasContent />
    </Suspense>
  );
}
