import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SII_DOCUMENT_TYPES } from "@/lib/csv-utils";

const monthNames = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") || "0");

    // Build date filter
    const startDate = new Date(year, month > 0 ? month - 1 : 0, 1);
    const endDate =
      month > 0
        ? new Date(year, month, 0, 23, 59, 59, 999)
        : new Date(year, 11, 31, 23, 59, 59, 999);

    // Check if there's any data
    const totalCount = await prisma.transaction.count();
    if (totalCount === 0) {
      return NextResponse.json({ hasData: false });
    }

    // Fetch aggregated data
    const [ventas, compras, ventasCount, comprasCount] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          categoria: "venta",
          fechaEmision: { gte: startDate, lte: endDate },
        },
        _sum: {
          montoTotal: true,
          montoNeto: true,
          montoIva: true,
        },
      }),
      prisma.transaction.aggregate({
        where: {
          categoria: "compra",
          fechaEmision: { gte: startDate, lte: endDate },
        },
        _sum: {
          montoTotal: true,
          montoNeto: true,
          montoIva: true,
        },
      }),
      prisma.transaction.count({
        where: {
          categoria: "venta",
          fechaEmision: { gte: startDate, lte: endDate },
        },
      }),
      prisma.transaction.count({
        where: {
          categoria: "compra",
          fechaEmision: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    const totalVentas = ventas._sum.montoTotal || 0;
    const totalCompras = compras._sum.montoTotal || 0;
    const ivaDebito = ventas._sum.montoIva || 0;
    const ivaCredito = compras._sum.montoIva || 0;
    const ivaPagar = ivaDebito - ivaCredito;

    // Monthly data for charts
    const allTransactions = await prisma.transaction.findMany({
      where: {
        fechaEmision: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31, 23, 59, 59, 999),
        },
      },
      select: {
        fechaEmision: true,
        categoria: true,
        montoTotal: true,
        montoIva: true,
      },
    });

    // Aggregate by month
    const monthlyData = monthNames.map((monthName, idx) => {
      const monthTransactions = allTransactions.filter((t) => {
        const d = new Date(t.fechaEmision);
        return d.getMonth() === idx;
      });

      const ventasMonth = monthTransactions
        .filter((t) => t.categoria === "venta")
        .reduce((sum, t) => sum + t.montoTotal, 0);

      const comprasMonth = monthTransactions
        .filter((t) => t.categoria === "compra")
        .reduce((sum, t) => sum + t.montoTotal, 0);

      const ivaVentas = monthTransactions
        .filter((t) => t.categoria === "venta")
        .reduce((sum, t) => sum + t.montoIva, 0);

      const ivaCompras = monthTransactions
        .filter((t) => t.categoria === "compra")
        .reduce((sum, t) => sum + t.montoIva, 0);

      return {
        month: monthName,
        ventas: ventasMonth,
        compras: comprasMonth,
        iva: ivaVentas - ivaCompras,
      };
    });

    // Document types distribution
    const ventasDocTypes = await prisma.transaction.groupBy({
      by: ["tipoDocumento"],
      where: {
        categoria: "venta",
        fechaEmision: { gte: startDate, lte: endDate },
      },
      _count: true,
    });

    const comprasDocTypes = await prisma.transaction.groupBy({
      by: ["tipoDocumento"],
      where: {
        categoria: "compra",
        fechaEmision: { gte: startDate, lte: endDate },
      },
      _count: true,
    });

    // YTD Comparison with previous year
    const previousYearTransactions = await prisma.transaction.findMany({
      where: {
        fechaEmision: {
          gte: new Date(year - 1, 0, 1),
          lte: new Date(year - 1, 11, 31, 23, 59, 59, 999),
        },
        categoria: "venta",
      },
      select: {
        fechaEmision: true,
        montoTotal: true,
      },
    });

    const ytdComparison = monthNames.map((monthName, idx) => {
      const currentMonthTotal = allTransactions
        .filter(
          (t) =>
            t.categoria === "venta" &&
            new Date(t.fechaEmision).getMonth() === idx
        )
        .reduce((sum, t) => sum + t.montoTotal, 0);

      const previousMonthTotal = previousYearTransactions
        .filter((t) => new Date(t.fechaEmision).getMonth() === idx)
        .reduce((sum, t) => sum + t.montoTotal, 0);

      return {
        month: monthName,
        actual: currentMonthTotal,
        anterior: previousMonthTotal,
      };
    });

    return NextResponse.json({
      hasData: true,
      kpis: {
        totalVentas,
        totalCompras,
        ivaDebito,
        ivaCredito,
        ivaPagar,
        cantidadDocumentos: ventasCount + comprasCount,
      },
      monthlyData,
      documentTypes: {
        ventas: ventasDocTypes.map((d) => ({
          code: d.tipoDocumento,
          name: SII_DOCUMENT_TYPES[d.tipoDocumento] || `Tipo ${d.tipoDocumento}`,
          value: d._count,
        })),
        compras: comprasDocTypes.map((d) => ({
          code: d.tipoDocumento,
          name: SII_DOCUMENT_TYPES[d.tipoDocumento] || `Tipo ${d.tipoDocumento}`,
          value: d._count,
        })),
      },
      ytdComparison,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Error al cargar el dashboard" },
      { status: 500 }
    );
  }
}
