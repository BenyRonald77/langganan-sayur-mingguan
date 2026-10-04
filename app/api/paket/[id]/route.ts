import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseItems } from "@/lib/format";

const serialize = (p: any) => ({ ...p, items: parseItems(p.items) });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const ada = await prisma.paket.findUnique({ where: { id } });
  if (!ada) return NextResponse.json({ error: "Paket tidak ditemukan" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const data: any = {};
  if (body?.nama !== undefined) data.nama = String(body.nama);
  if (body?.deskripsi !== undefined) data.deskripsi = String(body.deskripsi);
  if (body?.items !== undefined) data.items = JSON.stringify(Array.isArray(body.items) ? body.items.map(String) : []);
  if (body?.hargaMingguan !== undefined) {
    if (!Number.isInteger(body.hargaMingguan) || body.hargaMingguan <= 0)
      return NextResponse.json({ error: "hargaMingguan harus bilangan bulat positif" }, { status: 400 });
    data.hargaMingguan = body.hargaMingguan;
  }
  if (body?.hariPengiriman !== undefined) data.hariPengiriman = String(body.hariPengiriman);
  if (body?.aktif !== undefined) data.aktif = Boolean(body.aktif);
  const updated = await prisma.paket.update({ where: { id }, data });
  return NextResponse.json(serialize(updated));
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const ada = await prisma.paket.findUnique({
    where: { id },
    include: { _count: { select: { langganan: true } } },
  });
  if (!ada) return NextResponse.json({ error: "Paket tidak ditemukan" }, { status: 404 });
  if (ada._count.langganan > 0)
    return NextResponse.json({ error: "Paket masih dipakai langganan, nonaktifkan saja" }, { status: 409 });
  await prisma.paket.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
