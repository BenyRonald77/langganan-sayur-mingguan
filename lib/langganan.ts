import { prisma } from "@/lib/prisma";
import {
  diffDays,
  nowIso,
  sisaHariMinggu,
  tanggalKirimUntukMinggu,
  today,
  weekMonday,
} from "@/lib/format";

export class BisnisError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface HasilGenerate {
  minggu: string;
  dibuat: number;
  dilewati_skip: number;
  duplikat: number;
  orderIds: number[];
}

// Buat order pengiriman untuk semua langganan AKTIF pada minggu berjalan.
// Idempoten: minggu yang sama tidak membuat duplikat.
export async function generateMinggu(mingguInput?: string): Promise<HasilGenerate> {
  const minggu = weekMonday(mingguInput ?? today());
  const langgananAktif = await prisma.langganan.findMany({
    where: { status: "AKTIF" },
    include: { paket: true },
  });
  let dibuat = 0;
  let dilewati_skip = 0;
  let duplikat = 0;
  const orderIds: number[] = [];
  for (const lg of langgananAktif) {
    const tanggalKirim = tanggalKirimUntukMinggu(minggu, lg.paket.hariPengiriman);
    // Langganan yang mulai setelah tanggal kirim minggu ini belum ikut.
    if (lg.tanggalMulai > tanggalKirim) continue;
    const skip = await prisma.skipMinggu.findUnique({
      where: { langgananId_minggu: { langgananId: lg.id, minggu } },
    });
    if (skip) {
      dilewati_skip++;
      continue;
    }
    const ada = await prisma.order.findUnique({
      where: { langgananId_minggu: { langgananId: lg.id, minggu } },
    });
    if (ada) {
      duplikat++;
      continue;
    }
    const order = await prisma.order.create({
      data: {
        langgananId: lg.id,
        minggu,
        paketId: lg.paketId,
        namaPaket: lg.paket.nama,
        hargaSnapshot: lg.paket.hargaMingguan,
        tanggalKirim,
        createdAt: nowIso(),
      },
    });
    dibuat++;
    orderIds.push(order.id);
  }
  return { minggu, dibuat, dilewati_skip, duplikat, orderIds };
}

export async function skipMinggu(langgananId: number, mingguInput?: string) {
  const minggu = weekMonday(mingguInput ?? today());
  const lg = await prisma.langganan.findUnique({ where: { id: langgananId } });
  if (!lg) throw new BisnisError(404, "Langganan tidak ditemukan");
  const order = await prisma.order.findUnique({
    where: { langgananId_minggu: { langgananId, minggu } },
  });
  if (order)
    throw new BisnisError(
      409,
      "Order minggu ini sudah dibuat, tidak bisa di-skip"
    );
  const sudah = await prisma.skipMinggu.findUnique({
    where: { langgananId_minggu: { langgananId, minggu } },
  });
  if (sudah) throw new BisnisError(409, "Minggu ini sudah di-skip");
  return prisma.skipMinggu.create({
    data: { langgananId, minggu, createdAt: nowIso() },
  });
}

export interface HasilGantiPaket {
  langgananId: number;
  paketLama: string;
  paketBaru: string;
  penyesuaian: number | null;
  orderId: number | null;
}

// Ganti paket di tengah periode dengan hitungan prorata proporsional sisa hari minggu.
export async function gantiPaket(
  langgananId: number,
  paketBaruId: number,
  tanggalInput?: string
): Promise<HasilGantiPaket> {
  const tanggal = tanggalInput ?? today();
  const lg = await prisma.langganan.findUnique({
    where: { id: langgananId },
    include: { paket: true },
  });
  if (!lg) throw new BisnisError(404, "Langganan tidak ditemukan");
  if (lg.status === "BERHENTI")
    throw new BisnisError(400, "Langganan sudah berhenti, tidak bisa ganti paket");
  const paketBaru = await prisma.paket.findUnique({ where: { id: paketBaruId } });
  if (!paketBaru) throw new BisnisError(404, "Paket baru tidak ditemukan");
  if (!paketBaru.aktif) throw new BisnisError(400, "Paket baru tidak aktif");
  if (paketBaru.id === lg.paketId)
    throw new BisnisError(400, "Paket baru sama dengan paket saat ini");

  const minggu = weekMonday(tanggal);
  const order = await prisma.order.findUnique({
    where: { langgananId_minggu: { langgananId, minggu } },
  });

  let penyesuaian: number | null = null;
  let orderId: number | null = null;
  if (order && order.statusOrder === "TERJADWAL") {
    const sisaHari = sisaHariMinggu(tanggal);
    const selisih = Math.round(
      ((paketBaru.hargaMingguan - order.hargaSnapshot) * sisaHari) / 7
    );
    if (selisih !== 0) {
      await prisma.penyesuaian.create({
        data: {
          langgananId,
          orderId: order.id,
          tipe: "PRORATA",
          jumlah: selisih,
          keterangan: `Ganti paket ${order.namaPaket} -> ${paketBaru.nama}, prorata ${sisaHari}/7 hari`,
          tanggal,
        },
      });
      penyesuaian = selisih;
    }
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paketId: paketBaru.id,
        namaPaket: paketBaru.nama,
        hargaSnapshot: paketBaru.hargaMingguan,
      },
    });
    orderId = order.id;
  }

  await prisma.langganan.update({
    where: { id: langgananId },
    data: { paketId: paketBaru.id },
  });
  return {
    langgananId,
    paketLama: lg.paket.nama,
    paketBaru: paketBaru.nama,
    penyesuaian,
    orderId,
  };
}

export interface AksiReminder {
  orderId: number;
  langgananId: number;
  stage: number;
  aksi: string;
}

// Pengingat bertahap H+1/H+3/H+7 untuk order GAGAL; setelah H+7 langganan dihentikan otomatis.
export async function jalankanPengingat(tanggalInput?: string): Promise<{
  tanggal: string;
  aksi: AksiReminder[];
}> {
  const tanggal = tanggalInput ?? today();
  const orders = await prisma.order.findMany({
    where: { statusBayar: "GAGAL", statusOrder: { not: "DIBATALKAN" } },
  });
  const aksi: AksiReminder[] = [];
  for (const o of orders) {
    const lewat = diffDays(o.tanggalKirim, tanggal);
    let stageBaru: number | null = null;
    if (lewat >= 7 && o.reminderStage < 3) stageBaru = 3;
    else if (lewat >= 3 && o.reminderStage < 2) stageBaru = 2;
    else if (lewat >= 1 && o.reminderStage < 1) stageBaru = 1;
    if (stageBaru === null) continue;

    // Conditional single-statement update agar tahan race (idempoten per stage).
    const upd = await prisma.order.updateMany({
      where: { id: o.id, reminderStage: { lt: stageBaru }, statusBayar: "GAGAL" },
      data: { reminderStage: stageBaru },
    });
    if (upd.count === 0) continue;

    let aksiText = `Pengingat H+${stageBaru === 1 ? 1 : stageBaru === 2 ? 3 : 7} dikirim`;
    if (stageBaru === 3) {
      await prisma.langganan.updateMany({
        where: { id: o.langgananId, status: { not: "BERHENTI" } },
        data: { status: "BERHENTI" },
      });
      aksiText = "Pengingat H+7 dikirim, langganan DIHENTIKAN otomatis";
    }
    aksi.push({ orderId: o.id, langgananId: o.langgananId, stage: stageBaru, aksi: aksiText });
  }
  return { tanggal, aksi };
}
