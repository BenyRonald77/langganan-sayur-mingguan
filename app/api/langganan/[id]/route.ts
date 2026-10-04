import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BisnisError } from "@/lib/langganan";

async function ubahStatus(id: number, status: string, syarat: string[], label: string) {
  const lg = await prisma.langganan.findUnique({ where: { id } });
  if (!lg) throw new BisnisError(404, "Langganan tidak ditemukan");
  if (!syarat.includes(lg.status))
    throw new BisnisError(400, `Langganan berstatus ${lg.status}, tidak bisa ${label}`);
  return prisma.langganan.update({ where: { id }, data: { status } });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const { searchParams } = new URL(req.url);
    const aksi = searchParams.get("aksi");
    if (aksi === "pause") {
      const r = await ubahStatus(id, "PAUSE", ["AKTIF"], "di-pause");
      return NextResponse.json(r);
    }
    if (aksi === "resume") {
      const r = await ubahStatus(id, "AKTIF", ["PAUSE"], "di-resume");
      return NextResponse.json(r);
    }
    return NextResponse.json({ error: "aksi tidak dikenal (pause|resume)" }, { status: 400 });
  } catch (e) {
    if (e instanceof BisnisError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
