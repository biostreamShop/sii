-- CreateTable
CREATE TABLE "Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tipoDocumento" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "fechaEmision" DATETIME NOT NULL,
    "rut" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "montoExento" REAL NOT NULL DEFAULT 0,
    "montoNeto" REAL NOT NULL DEFAULT 0,
    "montoIva" REAL NOT NULL DEFAULT 0,
    "montoTotal" REAL NOT NULL DEFAULT 0,
    "categoria" TEXT NOT NULL,
    "reclassified" BOOLEAN NOT NULL DEFAULT false,
    "originalSource" TEXT,
    "uniqueHash" TEXT NOT NULL,
    "sourceFile" TEXT NOT NULL,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extraData" TEXT
);

-- CreateTable
CREATE TABLE "IvaAdjustment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "adjustedValue" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ImportLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "insertedRows" INTEGER NOT NULL,
    "duplicateRows" INTEGER NOT NULL,
    "reclassifiedRows" INTEGER NOT NULL,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processingTimeMs" INTEGER
);

-- CreateTable
CREATE TABLE "ColumnMapping" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fileType" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "columnName" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_uniqueHash_key" ON "Transaction"("uniqueHash");

-- CreateIndex
CREATE INDEX "Transaction_categoria_idx" ON "Transaction"("categoria");

-- CreateIndex
CREATE INDEX "Transaction_fechaEmision_idx" ON "Transaction"("fechaEmision");

-- CreateIndex
CREATE INDEX "Transaction_tipoDocumento_idx" ON "Transaction"("tipoDocumento");

-- CreateIndex
CREATE INDEX "Transaction_rut_idx" ON "Transaction"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "IvaAdjustment_year_month_key" ON "IvaAdjustment"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "ColumnMapping_fileType_fieldName_key" ON "ColumnMapping"("fileType", "fieldName");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");
