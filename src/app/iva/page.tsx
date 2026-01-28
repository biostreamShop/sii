"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Calculator, Edit2, Save, X, FileText } from "lucide-react";
import { formatCLP } from "@/lib/csv-utils";
import Link from "next/link";

interface MonthlyIva {
  month: number;
  monthName: string;
  ivaDebito: number;
  ivaCredito: number;
  calculado: number;
  ajustado: number | null;
  final: number;
  notas: string | null;
  netoVentas: number;
  netoCompras: number;
  cantidadVentas: number;
  cantidadCompras: number;
}

interface IvaData {
  year: number;
  monthlyIva: MonthlyIva[];
  totals: {
    ivaDebito: number;
    ivaCredito: number;
    calculado: number;
    final: number;
    netoVentas: number;
    netoCompras: number;
  };
  availableYears: number[];
}

function IvaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<IvaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingMonth, setEditingMonth] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const year = searchParams.get("year") || new Date().getFullYear().toString();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch(`/api/iva?year=${year}`);
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
  }, [year]);

  const handleYearChange = (newYear: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", newYear);
    router.push(`?${params}`);
  };

  const startEditing = (month: MonthlyIva) => {
    setEditingMonth(month.month);
    setEditValue(month.ajustado?.toString() || month.calculado.toString());
    setEditNotes(month.notas || "");
  };

  const cancelEditing = () => {
    setEditingMonth(null);
    setEditValue("");
    setEditNotes("");
  };

  const saveAdjustment = async (month: number) => {
    setSaving(true);
    try {
      const response = await fetch("/api/iva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: parseInt(year),
          month,
          adjustedValue: parseFloat(editValue),
          notes: editNotes,
        }),
      });

      if (!response.ok) throw new Error("Error al guardar");

      // Refresh data
      const refreshResponse = await fetch(`/api/iva?year=${year}`);
      const result = await refreshResponse.json();
      setData(result);
      cancelEditing();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const hasData = data?.monthlyIva.some(
    (m) => m.cantidadVentas > 0 || m.cantidadCompras > 0
  );

  if (!hasData && !loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">IVA Mensual</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <FileText className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-amber-800 mb-2">
            No hay datos de IVA
          </h2>
          <p className="text-amber-600 mb-6">
            Importa tus archivos CSV de ventas y compras para calcular el IVA.
          </p>
          <Link
            href="/importar"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
          >
            <Calculator className="w-5 h-5" />
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
          <h1 className="text-2xl font-bold text-gray-900">IVA Mensual</h1>
          <p className="text-gray-600 mt-1">
            Resumen de IVA por mes - Año {year}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <select
            value={year}
            onChange={(e) => handleYearChange(e.target.value)}
            className="block w-32 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
          >
            {(data?.availableYears || [new Date().getFullYear()]).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-600 font-medium">IVA Débito Anual</p>
          <p className="text-2xl font-bold text-blue-800">
            {formatCLP(data?.totals.ivaDebito || 0)}
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-sm text-purple-600 font-medium">
            IVA Crédito Anual
          </p>
          <p className="text-2xl font-bold text-purple-800">
            {formatCLP(data?.totals.ivaCredito || 0)}
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-600 font-medium">IVA Calculado</p>
          <p className="text-2xl font-bold text-amber-800">
            {formatCLP(data?.totals.calculado || 0)}
          </p>
        </div>
        <div
          className={`rounded-xl p-4 ${
            (data?.totals.final || 0) >= 0
              ? "bg-red-50 border border-red-200"
              : "bg-green-50 border border-green-200"
          }`}
        >
          <p
            className={`text-sm font-medium ${
              (data?.totals.final || 0) >= 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            IVA a Pagar Anual
          </p>
          <p
            className={`text-2xl font-bold ${
              (data?.totals.final || 0) >= 0 ? "text-red-800" : "text-green-800"
            }`}
          >
            {formatCLP(data?.totals.final || 0)}
          </p>
        </div>
      </div>

      {/* Monthly Table */}
      {loading ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border animate-pulse">
          <div className="h-96 bg-gray-200 rounded" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mes
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Docs Venta
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    IVA Débito
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Docs Compra
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    IVA Crédito
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    IVA Calculado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    IVA Ajustado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    IVA Final
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.monthlyIva.map((month) => (
                  <tr key={month.month} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{month.monthName}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {month.cantidadVentas}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-600">
                      {formatCLP(month.ivaDebito)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {month.cantidadCompras}
                    </td>
                    <td className="px-4 py-3 text-right text-purple-600">
                      {formatCLP(month.ivaCredito)}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-600">
                      {formatCLP(month.calculado)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editingMonth === month.month ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-32 px-2 py-1 border rounded text-right"
                        />
                      ) : month.ajustado !== null ? (
                        <span className="text-green-600">
                          {formatCLP(month.ajustado)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        month.final >= 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {formatCLP(month.final)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editingMonth === month.month ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => saveAdjustment(month.month)}
                            disabled={saving}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(month)}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-semibold">
                <tr>
                  <td className="px-4 py-3">TOTAL</td>
                  <td className="px-4 py-3 text-right">
                    {data?.monthlyIva.reduce(
                      (sum, m) => sum + m.cantidadVentas,
                      0
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-blue-600">
                    {formatCLP(data?.totals.ivaDebito || 0)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {data?.monthlyIva.reduce(
                      (sum, m) => sum + m.cantidadCompras,
                      0
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-purple-600">
                    {formatCLP(data?.totals.ivaCredito || 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-amber-600">
                    {formatCLP(data?.totals.calculado || 0)}
                  </td>
                  <td className="px-4 py-3 text-right">-</td>
                  <td
                    className={`px-4 py-3 text-right ${
                      (data?.totals.final || 0) >= 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {formatCLP(data?.totals.final || 0)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Edit Notes Modal */}
      {editingMonth !== null && (
        <div className="mt-4 bg-white rounded-xl p-4 shadow-sm border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas del ajuste (opcional)
          </label>
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Ej: Ajuste por nota de crédito..."
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
          />
        </div>
      )}

      {/* Info */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-medium text-blue-800 mb-2">Información</h4>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>
            <strong>IVA Calculado</strong> = IVA Débito (ventas) - IVA Crédito
            (compras)
          </li>
          <li>
            <strong>IVA Ajustado</strong> = Valor manual ingresado (para ajustes
            contables)
          </li>
          <li>
            <strong>IVA Final</strong> = IVA Ajustado si existe, sino IVA
            Calculado
          </li>
          <li>
            Valores <span className="text-red-600">positivos</span> = IVA a
            pagar al SII
          </li>
          <li>
            Valores <span className="text-green-600">negativos</span> = Crédito
            fiscal a favor
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function IvaPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32 mb-8" />
          <div className="h-96 bg-gray-200 rounded-xl" />
        </div>
      }
    >
      <IvaContent />
    </Suspense>
  );
}
