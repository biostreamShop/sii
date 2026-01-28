import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import prisma from "@/lib/prisma";
import {
  generateTransactionHash,
  parseChileanDate,
  parseChileanNumber,
  findColumnValue,
  isLiquidation,
  defaultColumnMappings,
} from "@/lib/csv-utils";

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

async function processCSV(
  fileContent: string,
  fileName: string,
  fileType: "ventas" | "compras"
): Promise<ImportResult> {
  const result: ImportResult = {
    fileName,
    fileType,
    totalRows: 0,
    insertedRows: 0,
    duplicateRows: 0,
    reclassifiedRows: 0,
    errorRows: 0,
    errors: [],
  };

  const startTime = Date.now();

  // Parse CSV
  const parsed = Papa.parse<Record<string, string>>(fileContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (parsed.errors.length > 0) {
    result.errors.push(
      ...parsed.errors.slice(0, 5).map((e) => `Línea ${e.row}: ${e.message}`)
    );
  }

  result.totalRows = parsed.data.length;
  const mappings = defaultColumnMappings[fileType];

  // Get all existing hashes for faster lookup
  const existingHashes = new Set(
    (await prisma.transaction.findMany({ select: { uniqueHash: true } })).map(
      (t) => t.uniqueHash
    )
  );

  const transactionsToInsert = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i];

    try {
      // Extract values using mappings
      const tipoDocumento = findColumnValue(row, mappings.tipoDocumento) || "";
      const folio = findColumnValue(row, mappings.folio) || "";
      const fechaStr = findColumnValue(row, mappings.fechaEmision) || "";
      const rut = findColumnValue(row, mappings.rut) || "";
      const razonSocial = findColumnValue(row, mappings.razonSocial) || "";
      const montoExento = parseChileanNumber(
        findColumnValue(row, mappings.montoExento) || "0"
      );
      const montoNeto = parseChileanNumber(
        findColumnValue(row, mappings.montoNeto) || "0"
      );
      const montoIva = parseChileanNumber(
        findColumnValue(row, mappings.montoIva) || "0"
      );
      const montoTotal = parseChileanNumber(
        findColumnValue(row, mappings.montoTotal) || "0"
      );

      // Parse date
      const fechaEmision = parseChileanDate(fechaStr);
      if (!fechaEmision) {
        result.errors.push(`Fila ${i + 2}: Fecha inválida "${fechaStr}"`);
        result.errorRows++;
        continue;
      }

      // Skip rows with no meaningful data
      if (!tipoDocumento && !folio && montoTotal === 0) {
        continue;
      }

      // Determine category and check for liquidation reclassification
      let categoria: "venta" | "compra" = fileType === "ventas" ? "venta" : "compra";
      let reclassified = false;
      let originalSource: string | null = null;

      if (fileType === "compras" && isLiquidation(tipoDocumento)) {
        categoria = "venta";
        reclassified = true;
        originalSource = "compras";
        result.reclassifiedRows++;
      }

      // Generate unique hash
      const uniqueHash = generateTransactionHash({
        fechaEmision,
        tipoDocumento,
        folio,
        rut,
        montoNeto,
        montoIva,
        montoTotal,
      });

      // Check for duplicates
      if (existingHashes.has(uniqueHash)) {
        result.duplicateRows++;
        continue;
      }

      // Add to batch
      existingHashes.add(uniqueHash); // Prevent duplicates within same file
      transactionsToInsert.push({
        tipoDocumento,
        folio,
        fechaEmision,
        rut,
        razonSocial,
        montoExento,
        montoNeto,
        montoIva,
        montoTotal,
        categoria,
        reclassified,
        originalSource,
        uniqueHash,
        sourceFile: fileName,
        extraData: JSON.stringify(row),
      });
    } catch (err) {
      result.errors.push(
        `Fila ${i + 2}: ${err instanceof Error ? err.message : "Error desconocido"}`
      );
      result.errorRows++;
    }
  }

  // Batch insert
  if (transactionsToInsert.length > 0) {
    await prisma.transaction.createMany({
      data: transactionsToInsert,
    });
    result.insertedRows = transactionsToInsert.length;
  }

  // Log import
  const processingTime = Date.now() - startTime;
  await prisma.importLog.create({
    data: {
      fileName,
      fileType,
      totalRows: result.totalRows,
      insertedRows: result.insertedRows,
      duplicateRows: result.duplicateRows,
      reclassifiedRows: result.reclassifiedRows,
      errorRows: result.errorRows,
      processingTimeMs: processingTime,
    },
  });

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const ventasFile = formData.get("ventas") as File | null;
    const comprasFile = formData.get("compras") as File | null;

    const results: ImportResult[] = [];

    if (ventasFile) {
      const content = await ventasFile.text();
      const result = await processCSV(content, ventasFile.name, "ventas");
      results.push(result);
    }

    if (comprasFile) {
      const content = await comprasFile.text();
      const result = await processCSV(content, comprasFile.name, "compras");
      results.push(result);
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error al importar archivos",
      },
      { status: 500 }
    );
  }
}
