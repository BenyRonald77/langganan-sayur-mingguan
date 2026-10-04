import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const row = await prisma.pelanggan.findUnique({
    where: { id },
    include: {
      langganan: { include: { paket: true }, orderBy: { id: "desc" } },
    },
  });
  if (!row) return NextResponse.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}
