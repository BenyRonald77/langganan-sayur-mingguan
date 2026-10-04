import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nowIso, today } from "@/lib/format";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (status !== "LUNAS" && status !== "GAGAL")
    return NextResponse.json({ error: "status harus LUNAS atau GAGAL" }, { status: 400 });
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
  if (order.statusBayar === "LUNAS")
    return NextResponse.json({ error: "Order sudah lunas" }, { status: 409 });
  if (order.statusOrder === "DIBATALKAN")
    return NextResponse.json({ error: "Order dibatalkan" }, { status: 409 });

  const updated = await prisma.order.update({
    where: { id },
    data: { statusBayar: status, reminderStage: status === "LUNAS" ? 0 : order.reminderStage },
  });
  await prisma.pembayaran.create({
    data: {
      orderId: id,
      tanggal: today(),
      jumlah: order.hargaSnapshot,
      metode: typeof body?.metode === "string" ? body.metode : "simulasi",
      status,
      keterangan: typeof body?.keterangan === "string" ? body.keterangan : "",
    },
  });
  return NextResponse.json(updated);
}
