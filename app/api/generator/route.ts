import { NextRequest, NextResponse } from "next/server";
import { generateMinggu } from "@/lib/langganan";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const hasil = await generateMinggu(body?.minggu);
  return NextResponse.json(hasil, { status: 201 });
}
