import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseItems } from "@/lib/format";

const serialize = (p: any) => ({ ...p, items: parseItems(p.items) });

export async function GET() {
  const rows = await prisma.paket.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(rows.map(serialize));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { nama, deskripsi, items, hargaMingguan, hariPengiriman } = body ?? {};
  if (!nama || typeof nama !== "string" || !nama.trim())
    return NextResponse.json({ error: "nama wajib diisi" }, { status: 400 });
  if (!Number.isInteger(hargaMingguan) || hargaMingguan <= 0)
    return NextResponse.json({ error: "hargaMingguan harus bilangan bulat positif" }, { status: 400 });
  if (!hariPengiriman || typeof hariPengiriman !== "string")
    return NextResponse.json({ error: "hariPengiriman wajib diisi" }, { status: 400 });
  const created = await prisma.paket.create({
    data: {
      nama: nama.trim(),
      deskripsi: typeof deskripsi === "string" ? deskripsi : "",
      items: JSON.stringify(Array.isArray(items) ? items.map(String) : []),
      hargaMingguan,
      hariPengiriman,
    },
  });
  return NextResponse.json(serialize(created), { status: 201 });
}
