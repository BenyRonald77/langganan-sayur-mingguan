import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nowIso, today } from "@/lib/format";
import { BisnisError } from "@/lib/langganan";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const { pelangganId, paketId, tanggalMulai } = body ?? {};
    if (!Number.isInteger(pelangganId))
      return NextResponse.json({ error: "pelangganId wajib diisi" }, { status: 400 });
    if (!Number.isInteger(paketId))
      return NextResponse.json({ error: "paketId wajib diisi" }, { status: 400 });
    const pelanggan = await prisma.pelanggan.findUnique({ where: { id: pelangganId } });
    if (!pelanggan) return NextResponse.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 });
    const paket = await prisma.paket.findUnique({ where: { id: paketId } });
    if (!paket) return NextResponse.json({ error: "Paket tidak ditemukan" }, { status: 404 });
    if (!paket.aktif)
      return NextResponse.json({ error: "Paket tidak aktif" }, { status: 400 });
    const mulai = typeof tanggalMulai === "string" && tanggalMulai ? tanggalMulai : today();
    const aktifSama = await prisma.langganan.findFirst({
      where: { pelangganId, status: { in: ["AKTIF", "PAUSE"] } },
    });
    if (aktifSama)
      return NextResponse.json(
        { error: "Pelanggan sudah punya langganan aktif/pause" },
        { status: 409 }
      );
    const created = await prisma.langganan.create({
      data: {
        pelangganId,
        paketId,
        tanggalMulai: mulai,
        status: "AKTIF",
        createdAt: nowIso(),
      },
      include: { paket: true, pelanggan: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    if (e instanceof BisnisError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pelangganId = searchParams.get("pelangganId");
  const where = pelangganId ? { pelangganId: Number(pelangganId) } : {};
  const rows = await prisma.langganan.findMany({
    where,
    include: { paket: true, pelanggan: true },
    orderBy: { id: "desc" },
  });
  return NextResponse.json(rows);
}
