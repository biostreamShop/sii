import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(
      searchParams.get("year") || String(new Date().getFullYear())
    );

    // Get all transactions for the year
    const transactions = await prisma.transaction.findMany({
      where: {
        fechaEmision: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31, 23, 59, 59, 999),
        },
      },
      select: {
        fechaEmision: true,
        categoria: true,
        montoIva: true,
        montoNeto: true,
        montoTotal: true,
      },
    });

    // Get IVA adjustments for the year
    const adjustments = await prisma.ivaAdjustment.findMany({
      where: { year },
    });

    const adjustmentsMap = new Map(adjustments.map((a) => [a.month, a]));

    // Calculate IVA by month
    const monthlyIva = monthNames.map((monthName, idx) => {
      const monthNum = idx + 1;
      const monthTransactions = transactions.filter((t) => {
        const d = new Date(t.fechaEmision);
        return d.getMonth() === idx;
      });

      const ivaDebito = monthTransactions
        .filter((t) => t.categoria === "venta")
        .reduce((sum, t) => sum + t.montoIva, 0);

      const ivaCredito = monthTransactions
        .filter((t) => t.categoria === "compra")
        .reduce((sum, t) => sum + t.montoIva, 0);

      const netoVentas = monthTransactions
        .filter((t) => t.categoria === "venta")
        .reduce((sum, t) => sum + t.montoNeto, 0);

      const netoCompras = monthTransactions
        .filter((t) => t.categoria === "compra")
        .reduce((sum, t) => sum + t.montoNeto, 0);

      const calculado = ivaDebito - ivaCredito;
      const adjustment = adjustmentsMap.get(monthNum);

      return {
        month: monthNum,
        monthName,
        ivaDebito,
        ivaCredito,
        calculado,
        ajustado: adjustment?.adjustedValue ?? null,
        final: adjustment?.adjustedValue ?? calculado,
        notas: adjustment?.notes ?? null,
        netoVentas,
        netoCompras,
        cantidadVentas: monthTransactions.filter((t) => t.categoria === "venta")
          .length,
        cantidadCompras: monthTransactions.filter(
          (t) => t.categoria === "compra"
        ).length,
      };
    });

    // Calculate yearly totals
    const totals = monthlyIva.reduce(
      (acc, m) => ({
        ivaDebito: acc.ivaDebito + m.ivaDebito,
        ivaCredito: acc.ivaCredito + m.ivaCredito,
        calculado: acc.calculado + m.calculado,
        final: acc.final + m.final,
        netoVentas: acc.netoVentas + m.netoVentas,
        netoCompras: acc.netoCompras + m.netoCompras,
      }),
      {
        ivaDebito: 0,
        ivaCredito: 0,
        calculado: 0,
        final: 0,
        netoVentas: 0,
        netoCompras: 0,
      }
    );

    // Get available years
    const years = await prisma.transaction.groupBy({
      by: ["fechaEmision"],
      _count: true,
    });

    const availableYears = [
      ...new Set(years.map((y) => new Date(y.fechaEmision).getFullYear())),
    ].sort((a, b) => b - a);

    return NextResponse.json({
      year,
      monthlyIva,
      totals,
      availableYears,
    });
  } catch (error) {
    console.error("IVA API error:", error);
    return NextResponse.json({ error: "Error al cargar IVA" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, month, adjustedValue, notes } = body;

    if (!year || !month) {
      return NextResponse.json(
        { error: "Año y mes son requeridos" },
        { status: 400 }
      );
    }

    const adjustment = await prisma.ivaAdjustment.upsert({
      where: {
        year_month: { year, month },
      },
      update: {
        adjustedValue: parseFloat(adjustedValue),
        notes,
      },
      create: {
        year,
        month,
        adjustedValue: parseFloat(adjustedValue),
        notes,
      },
    });

    return NextResponse.json({ success: true, adjustment });
  } catch (error) {
    console.error("IVA adjustment error:", error);
    return NextResponse.json(
      { error: "Error al guardar ajuste de IVA" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(searchParams.get("year") || "0");
    const month = parseInt(searchParams.get("month") || "0");

    if (!year || !month) {
      return NextResponse.json(
        { error: "Año y mes son requeridos" },
        { status: 400 }
      );
    }

    await prisma.ivaAdjustment.delete({
      where: {
        year_month: { year, month },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete IVA adjustment error:", error);
    return NextResponse.json(
      { error: "Error al eliminar ajuste de IVA" },
      { status: 500 }
    );
  }
}
