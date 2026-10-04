import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
  if (order.statusOrder !== "TERJADWAL")
    return NextResponse.json({ error: `Order berstatus ${order.statusOrder}` }, { status: 409 });
  const updated = await prisma.order.update({
    where: { id },
    data: { statusOrder: "DIKIRIM" },
  });
  return NextResponse.json(updated);
}
