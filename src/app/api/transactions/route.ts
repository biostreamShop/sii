import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SII_DOCUMENT_TYPES } from "@/lib/csv-utils";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoria = searchParams.get("categoria"); // "venta" or "compra"
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const tipoDocumento = searchParams.get("tipoDocumento");
    const rut = searchParams.get("rut");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");

    // Build where clause
    const where: Record<string, unknown> = {};

    if (categoria) {
      where.categoria = categoria;
    }

    if (year) {
      const yearNum = parseInt(year);
      const startDate = new Date(yearNum, month ? parseInt(month) - 1 : 0, 1);
      const endDate = month
        ? new Date(yearNum, parseInt(month), 0, 23, 59, 59, 999)
        : new Date(yearNum, 11, 31, 23, 59, 59, 999);

      where.fechaEmision = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (tipoDocumento) {
      where.tipoDocumento = { contains: tipoDocumento };
    }

    if (rut) {
      where.rut = { contains: rut.replace(/[.-]/g, "") };
    }

    // Get total count and data
    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        orderBy: { fechaEmision: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // Get available years for filter
    const years = await prisma.transaction.groupBy({
      by: ["fechaEmision"],
      _count: true,
    });

    const availableYears = [
      ...new Set(years.map((y) => new Date(y.fechaEmision).getFullYear())),
    ].sort((a, b) => b - a);

    // Get document types for filter
    const docTypes = await prisma.transaction.groupBy({
      by: ["tipoDocumento"],
      where: categoria ? { categoria } : undefined,
      _count: true,
    });

    return NextResponse.json({
      transactions,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      filters: {
        availableYears,
        documentTypes: docTypes.map((d) => ({
          code: d.tipoDocumento,
          name: SII_DOCUMENT_TYPES[d.tipoDocumento] || `Tipo ${d.tipoDocumento}`,
          count: d._count,
        })),
      },
    });
  } catch (error) {
    console.error("Transactions API error:", error);
    return NextResponse.json(
      { error: "Error al cargar transacciones" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      await prisma.transaction.delete({
        where: { id: parseInt(id) },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  } catch (error) {
    console.error("Delete transaction error:", error);
    return NextResponse.json(
      { error: "Error al eliminar transacción" },
      { status: 500 }
    );
  }
}
