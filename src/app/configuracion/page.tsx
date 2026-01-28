"use client";

import { useState, useEffect } from "react";
import { Save, RefreshCw, Trash2, AlertTriangle, Database, FileText } from "lucide-react";

interface ImportLog {
  id: number;
  fileName: string;
  fileType: string;
  totalRows: number;
  insertedRows: number;
  duplicateRows: number;
  reclassifiedRows: number;
  errorRows: number;
  importedAt: string;
  processingTimeMs: number | null;
}

interface Stats {
  totalTransactions: number;
  totalVentas: number;
  totalCompras: number;
  oldestRecord: string | null;
  newestRecord: string | null;
}

export default function ConfiguracionPage() {
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        fetch("/api/config/logs"),
        fetch("/api/config/stats"),
      ]);

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setImportLogs(logsData.logs);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function clearAllData() {
    setClearing(true);
    try {
      const response = await fetch("/api/config/clear", { method: "DELETE" });
      if (response.ok) {
        await fetchData();
        setShowConfirm(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-1">
          Administra los datos y configuración del sistema
        </p>
      </div>

      {/* Database Stats */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-6 h-6 text-blue-500" />
          <h2 className="text-lg font-semibold">Estado de la Base de Datos</h2>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-700">
                {stats.totalTransactions}
              </p>
              <p className="text-xs text-gray-500">Total Registros</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalVentas}
              </p>
              <p className="text-xs text-blue-600">Ventas</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {stats.totalCompras}
              </p>
              <p className="text-xs text-green-600">Compras</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">
                {stats.oldestRecord
                  ? new Date(stats.oldestRecord).toLocaleDateString("es-CL")
                  : "-"}
              </p>
              <p className="text-xs text-gray-500">Registro más antiguo</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">
                {stats.newestRecord
                  ? new Date(stats.newestRecord).toLocaleDateString("es-CL")
                  : "-"}
              </p>
              <p className="text-xs text-gray-500">Registro más reciente</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No hay datos disponibles</p>
        )}
      </div>

      {/* Import History */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-green-500" />
            <h2 className="text-lg font-semibold">Historial de Importaciones</h2>
          </div>
          <button
            onClick={fetchData}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded" />
            ))}
          </div>
        ) : importLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Fecha
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Archivo
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Tipo
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                    Total
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                    Nuevos
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                    Duplicados
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                    Reclasif.
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                    Tiempo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {importLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm">
                      {new Date(log.importedAt).toLocaleString("es-CL")}
                    </td>
                    <td className="px-3 py-2 text-sm font-medium">
                      {log.fileName}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          log.fileType === "ventas"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {log.fileType}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-right">
                      {log.totalRows}
                    </td>
                    <td className="px-3 py-2 text-sm text-right text-green-600">
                      {log.insertedRows}
                    </td>
                    <td className="px-3 py-2 text-sm text-right text-amber-600">
                      {log.duplicateRows}
                    </td>
                    <td className="px-3 py-2 text-sm text-right text-purple-600">
                      {log.reclassifiedRows}
                    </td>
                    <td className="px-3 py-2 text-sm text-right text-gray-500">
                      {log.processingTimeMs ? `${log.processingTimeMs}ms` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No hay importaciones registradas
          </p>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <h2 className="text-lg font-semibold text-red-800">Zona de Peligro</h2>
        </div>

        <p className="text-red-700 mb-4">
          Esta acción eliminará todos los datos de la base de datos. Esta acción
          no se puede deshacer.
        </p>

        {showConfirm ? (
          <div className="flex items-center gap-4">
            <span className="text-red-800 font-medium">
              ¿Estás seguro de eliminar todos los datos?
            </span>
            <button
              onClick={clearAllData}
              disabled={clearing}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              {clearing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Confirmar eliminación
                </>
              )}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar todos los datos
          </button>
        )}
      </div>

      {/* Column Mappings Info */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-800 mb-3">
          Mapeo de columnas CSV
        </h3>
        <p className="text-gray-600 mb-4">
          El sistema intenta detectar automáticamente las columnas de tus
          archivos CSV usando estos nombres comunes:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Ventas</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                <strong>Fecha:</strong> Fecha, Fecha Emision, FechaEmision
              </li>
              <li>
                <strong>Tipo Doc:</strong> Tipo Doc, Tipo Documento, Tipo
              </li>
              <li>
                <strong>Folio:</strong> Folio, N° Documento, Numero
              </li>
              <li>
                <strong>RUT:</strong> RUT, Rut Cliente
              </li>
              <li>
                <strong>Razón Social:</strong> Razon Social, Cliente, Nombre
              </li>
              <li>
                <strong>Montos:</strong> Exento, Neto, IVA, Total
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Compras</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                <strong>Fecha:</strong> Fecha, Fecha Emision, Fecha Recepción
              </li>
              <li>
                <strong>Tipo Doc:</strong> Tipo Doc, Tipo Documento, Tipo
              </li>
              <li>
                <strong>Folio:</strong> Folio, N° Documento, Numero
              </li>
              <li>
                <strong>RUT:</strong> RUT, Rut Proveedor
              </li>
              <li>
                <strong>Razón Social:</strong> Razon Social, Proveedor, Nombre
              </li>
              <li>
                <strong>IVA Crédito:</strong> IVA, IVA Recuperable
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
