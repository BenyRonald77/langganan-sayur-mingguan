import { NextRequest, NextResponse } from "next/server";
import { jalankanPengingat } from "@/lib/langganan";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const hasil = await jalankanPengingat(body?.tanggal);
  return NextResponse.json(hasil);
}
