"use client";

import { useRouter } from "next/navigation";
import CsvImporter from "@/components/CsvImporter";

export default function ImportarPage() {
  const router = useRouter();

  const handleImportComplete = () => {
    // Refresh the page data
    router.refresh();
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Importar CSV</h1>
        <p className="text-gray-600 mt-1">
          Sube tus archivos CSV de ventas y compras del SII
        </p>
      </div>

      <CsvImporter onImportComplete={handleImportComplete} />
    </div>
  );
}
