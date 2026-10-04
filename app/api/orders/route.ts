import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const langgananId = searchParams.get("langgananId");
  const pelangganId = searchParams.get("pelangganId");
  const where: any = {};
  if (langgananId) where.langgananId = Number(langgananId);
  if (pelangganId) where.langganan = { pelangganId: Number(pelangganId) };
  const rows = await prisma.order.findMany({
    where,
    include: { langganan: { include: { pelanggan: true } }, pembayaran: true },
    orderBy: [{ minggu: "desc" }, { id: "desc" }],
  });
  return NextResponse.json(rows);
}
