import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.pelanggan.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { nama, telepon, alamat, catatan } = body ?? {};
  if (!nama || typeof nama !== "string" || !nama.trim())
    return NextResponse.json({ error: "nama wajib diisi" }, { status: 400 });
  if (!telepon || typeof telepon !== "string" || !telepon.trim())
    return NextResponse.json({ error: "telepon wajib diisi" }, { status: 400 });
  const created = await prisma.pelanggan.create({
    data: {
      nama: nama.trim(),
      telepon: telepon.trim(),
      alamat: typeof alamat === "string" ? alamat : "",
      catatan: typeof catatan === "string" ? catatan : "",
    },
  });
  return NextResponse.json(created, { status: 201 });
}
