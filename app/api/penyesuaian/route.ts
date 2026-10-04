import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const langgananId = searchParams.get("langgananId");
  const where = langgananId ? { langgananId: Number(langgananId) } : {};
  const rows = await prisma.penyesuaian.findMany({
    where,
    include: { order: true },
    orderBy: { id: "desc" },
  });
  return NextResponse.json(rows);
}
