"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";

interface ImportResult {
  fileName: string;
  fileType: string;
  totalRows: number;
  insertedRows: number;
  duplicateRows: number;
  reclassifiedRows: number;
  errorRows: number;
  errors: string[];
}

interface CsvImporterProps {
  onImportComplete?: () => void;
}

export default function CsvImporter({ onImportComplete }: CsvImporterProps) {
  const [ventasFile, setVentasFile] = useState<File | null>(null);
  const [comprasFile, setComprasFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, type: "ventas" | "compras") => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
        if (type === "ventas") {
          setVentasFile(file);
        } else {
          setComprasFile(file);
        }
      }
    },
    []
  );

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "ventas" | "compras"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === "ventas") {
        setVentasFile(file);
      } else {
        setComprasFile(file);
      }
    }
  };

  const handleImport = async () => {
    if (!ventasFile && !comprasFile) {
      setError("Debes seleccionar al menos un archivo CSV");
      return;
    }

    setIsImporting(true);
    setError(null);
    setResults([]);

    try {
      const formData = new FormData();
      if (ventasFile) {
        formData.append("ventas", ventasFile);
      }
      if (comprasFile) {
        formData.append("compras", comprasFile);
      }

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al importar archivos");
      }

      const data = await response.json();
      setResults(data.results);

      // Reset files after successful import
      setVentasFile(null);
      setComprasFile(null);

      // Notify parent component
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsImporting(false);
    }
  };

  const FileDropZone = ({
    type,
    file,
    onDrop,
    onFileSelect,
  }: {
    type: "ventas" | "compras";
    file: File | null;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
        file
          ? "border-green-400 bg-green-50"
          : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
      }`}
    >
      <input
        type="file"
        accept=".csv"
        onChange={onFileSelect}
        className="hidden"
        id={`file-${type}`}
      />
      <label htmlFor={`file-${type}`} className="cursor-pointer">
        {file ? (
          <div className="flex flex-col items-center">
            <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
            <p className="font-medium text-green-700">{file.name}</p>
            <p className="text-sm text-green-600">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-12 h-12 text-gray-400 mb-2" />
            <p className="font-medium text-gray-700">
              CSV de {type === "ventas" ? "Ventas" : "Compras"}
            </p>
            <p className="text-sm text-gray-500">
              Arrastra o haz clic para seleccionar
            </p>
          </div>
        )}
      </label>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* File Drop Zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FileDropZone
          type="ventas"
          file={ventasFile}
          onDrop={(e) => handleDrop(e, "ventas")}
          onFileSelect={(e) => handleFileSelect(e, "ventas")}
        />
        <FileDropZone
          type="compras"
          file={comprasFile}
          onDrop={(e) => handleDrop(e, "compras")}
          onFileSelect={(e) => handleFileSelect(e, "compras")}
        />
      </div>

      {/* Import Button */}
      <div className="flex justify-center">
        <button
          onClick={handleImport}
          disabled={isImporting || (!ventasFile && !comprasFile)}
          className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isImporting ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Importar Archivos
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Error en la importación</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Resultado de la importación</h3>
          {results.map((result, index) => (
            <div
              key={index}
              className="bg-white border rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="font-medium">{result.fileName}</p>
                  <p className="text-sm text-gray-500 capitalize">
                    {result.fileType}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-700">
                    {result.totalRows}
                  </p>
                  <p className="text-xs text-gray-500">Total filas</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {result.insertedRows}
                  </p>
                  <p className="text-xs text-green-600">Insertadas</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600">
                    {result.duplicateRows}
                  </p>
                  <p className="text-xs text-amber-600">Duplicadas</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {result.reclassifiedRows}
                  </p>
                  <p className="text-xs text-purple-600">Reclasificadas</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {result.errorRows}
                  </p>
                  <p className="text-xs text-red-600">Errores</p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="font-medium text-red-800">
                      Errores encontrados:
                    </p>
                  </div>
                  <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                    {result.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {result.errors.length > 5 && (
                      <li>...y {result.errors.length - 5} más</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-medium text-blue-800 mb-2">Instrucciones</h4>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Puedes importar uno o ambos archivos CSV a la vez.</li>
          <li>Los registros duplicados serán detectados automáticamente y no se insertarán dos veces.</li>
          <li>Las liquidaciones en el archivo de compras se reclasificarán como ventas automáticamente.</li>
          <li>Puedes reimportar archivos de cualquier período sin preocuparte por duplicados.</li>
        </ul>
      </div>
    </div>
  );
}
