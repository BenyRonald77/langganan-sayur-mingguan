import { NextRequest, NextResponse } from "next/server";
import { skipMinggu, BisnisError } from "@/lib/langganan";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => null);
    const r = await skipMinggu(Number(params.id), body?.minggu);
    return NextResponse.json(r, { status: 201 });
  } catch (e) {
    if (e instanceof BisnisError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
