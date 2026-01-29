import CryptoJS from "crypto-js";

// Types for CSV data
export interface RawTransaction {
  tipoDocumento: string;
  folio: string;
  fechaEmision: Date;
  rut: string;
  razonSocial: string;
  montoExento: number;
  montoNeto: number;
  montoIva: number;
  montoTotal: number;
  categoria: "venta" | "compra";
  reclassified: boolean;
  originalSource?: string;
  extraData?: Record<string, unknown>;
}

export interface ImportResult {
  totalRows: number;
  insertedRows: number;
  duplicateRows: number;
  reclassifiedRows: number;
  errorRows: number;
  errors: string[];
}

// Default column mappings for SII CSV files
export const defaultColumnMappings = {
  ventas: {
    tipoDocumento: ["Tipo Doc"],
    folio: ["Folio"],
    fechaEmision: ["Fecha Docto"],
    rut: ["Rut cliente"],
    razonSocial: ["Razon Social"],
    montoExento: ["Monto Exento"],
    montoNeto: ["Monto Neto"],
    montoIva: ["Monto IVA"],
    montoTotal: ["Monto total"],
  },
  compras: {
    tipoDocumento: ["Tipo Doc"],
    folio: ["Folio"],
    fechaEmision: ["Fecha Docto"],
    rut: ["RUT Proveedor"],
    razonSocial: ["Razon Social"],
    montoExento: ["Monto Exento"],
    montoNeto: ["Monto Neto"],
    montoIva: ["Monto IVA Recuperable"],
    montoTotal: ["Monto Total"],
  },
};

// Liquidation document types that should be reclassified from purchases to sales
// Type 43 = Liquidación Factura Electrónica
export const liquidationDocTypes = [
  "43",
  "Liquidación",
  "Liquidacion",
  "Liquidación Factura",
  "Liquidacion Factura",
  "Liquidación-Factura Electrónica",
  "Liquidación-Factura",
];

// Generate unique hash for deduplication
export function generateTransactionHash(transaction: {
  fechaEmision: Date;
  tipoDocumento: string;
  folio: string;
  rut: string;
  montoNeto: number;
  montoIva: number;
  montoTotal: number;
}): string {
  const normalized = [
    transaction.fechaEmision.toISOString().split("T")[0],
    transaction.tipoDocumento.trim().toLowerCase(),
    transaction.folio.toString().trim(),
    transaction.rut.replace(/[.-]/g, "").trim(),
    Math.round(transaction.montoNeto * 100),
    Math.round(transaction.montoIva * 100),
    Math.round(transaction.montoTotal * 100),
  ].join("|");

  return CryptoJS.SHA256(normalized).toString();
}

// Parse Chilean date formats (including with time)
export function parseChileanDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Remove time portion if present (e.g., "05/01/2026 20:20:45" -> "05/01/2026")
  const dateOnly = dateStr.split(" ")[0].trim();

  // Try different formats
  const formats = [
    // DD/MM/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // DD-MM-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    // YYYY-MM-DD
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // YYYY/MM/DD
    /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
  ];

  for (const format of formats) {
    const match = dateOnly.match(format);
    if (match) {
      if (match[1].length === 4) {
        // YYYY-MM-DD format
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      } else {
        // DD-MM-YYYY format
        return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
      }
    }
  }

  // Try standard Date parsing
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

// Parse Chilean number format (1.234,56 or 1234.56 or just 1234)
export function parseChileanNumber(numStr: string | number): number {
  if (typeof numStr === "number") return numStr;
  if (!numStr || numStr === "" || numStr === "-") return 0;

  // Remove currency symbols and spaces
  let cleaned = numStr.toString().replace(/[$\s]/g, "").trim();

  // Handle parentheses for negative numbers
  if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
    cleaned = "-" + cleaned.slice(1, -1);
  }

  // Detect format: Chilean uses . for thousands and , for decimals
  // US/International uses , for thousands and . for decimals
  const hasCommaDecimal = /\d,\d{1,2}$/.test(cleaned);
  const hasDotThousands = /\d\.\d{3}/.test(cleaned);

  if (hasCommaDecimal || hasDotThousands) {
    // Chilean format: remove dots (thousands), replace comma with dot (decimal)
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    // US format or no separators: just remove commas
    cleaned = cleaned.replace(/,/g, "");
  }

  const result = parseFloat(cleaned);
  return isNaN(result) ? 0 : result;
}

// Find column in CSV data by trying multiple possible names
export function findColumnValue(
  row: Record<string, string>,
  possibleNames: string[]
): string | undefined {
  const keys = Object.keys(row);
  for (const name of possibleNames) {
    const found = keys.find(
      (k) => k.trim().toLowerCase() === name.toLowerCase()
    );
    if (found && row[found] !== undefined && row[found] !== "") {
      return row[found];
    }
  }
  return undefined;
}

// Check if a document type is a liquidation (Type 43)
export function isLiquidation(tipoDocumento: string): boolean {
  const normalized = tipoDocumento.trim();
  // Check if it's exactly "43" or contains liquidación
  if (normalized === "43") return true;
  return liquidationDocTypes.some(
    (type) => normalized.toLowerCase().includes(type.toLowerCase())
  );
}

// Format number as Chilean currency
export function formatCLP(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date in Chilean format
export function formatDateCL(date: Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
