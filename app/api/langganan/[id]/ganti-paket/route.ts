import { NextRequest, NextResponse } from "next/server";
import { gantiPaket, BisnisError } from "@/lib/langganan";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => null);
    if (!Number.isInteger(body?.paketBaruId))
      return NextResponse.json({ error: "paketBaruId wajib diisi" }, { status: 400 });
    const r = await gantiPaket(Number(params.id), body.paketBaruId, body?.tanggal);
    return NextResponse.json(r);
  } catch (e) {
    if (e instanceof BisnisError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
