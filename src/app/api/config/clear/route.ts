import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE() {
  try {
    // Delete all data in order
    await prisma.ivaAdjustment.deleteMany({});
    await prisma.importLog.deleteMany({});
    await prisma.transaction.deleteMany({});

    return NextResponse.json({ success: true, message: "Todos los datos han sido eliminados" });
  } catch (error) {
    console.error("Clear data API error:", error);
    return NextResponse.json(
      { error: "Error al eliminar datos" },
      { status: 500 }
    );
  }
}
