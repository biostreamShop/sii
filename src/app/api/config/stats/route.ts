import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [totalTransactions, totalVentas, totalCompras, oldest, newest] =
      await Promise.all([
        prisma.transaction.count(),
        prisma.transaction.count({ where: { categoria: "venta" } }),
        prisma.transaction.count({ where: { categoria: "compra" } }),
        prisma.transaction.findFirst({
          orderBy: { fechaEmision: "asc" },
          select: { fechaEmision: true },
        }),
        prisma.transaction.findFirst({
          orderBy: { fechaEmision: "desc" },
          select: { fechaEmision: true },
        }),
      ]);

    return NextResponse.json({
      totalTransactions,
      totalVentas,
      totalCompras,
      oldestRecord: oldest?.fechaEmision || null,
      newestRecord: newest?.fechaEmision || null,
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { error: "Error al cargar estadísticas" },
      { status: 500 }
    );
  }
}
