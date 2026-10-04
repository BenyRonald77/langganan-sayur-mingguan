import { PrismaClient } from "@prisma/client";
import { nowIso } from "@/lib/format";

const prisma = new PrismaClient();

async function main() {
  const n = await prisma.paket.count();
  if (n > 0) {
    console.log("seed dilewati (sudah ada data)");
    return;
  }

  const hemat = await prisma.paket.create({
    data: {
      nama: "Paket Hemat",
      deskripsi: "Sayur segar harian untuk 1-2 orang, cukup untuk seminggu.",
      items: JSON.stringify(["Kangkung 2 ikat", "Bayam 2 ikat", "Wortel 500g", "Kentang 1kg", "Kol 1 buah"]),
      hargaMingguan: 35000,
      hariPengiriman: "Sabtu",
    },
  });
  const keluarga = await prisma.paket.create({
    data: {
      nama: "Paket Keluarga",
      deskripsi: "Porsi keluarga 3-5 orang dengan variasi sayur lengkap.",
      items: JSON.stringify(["Kangkung 3 ikat", "Bayam 3 ikat", "Wortel 1kg", "Kentang 2kg", "Tomat 1kg", "Cabai merah 250g", "Bawang merah 500g"]),
      hargaMingguan: 60000,
      hariPengiriman: "Sabtu",
    },
  });
  const organik = await prisma.paket.create({
    data: {
      nama: "Paket Organik Premium",
      deskripsi: "Sayur organik bersertifikat dari petani mitra, tanpa pestisida.",
      items: JSON.stringify(["Bayam organik 3 ikat", "Wortel organik 1kg", "Brokoli organik 2 buah", "Tomat cherry 500g", "Selada romaine 2 buah", "Pakcoy 1kg"]),
      hargaMingguan: 95000,
      hariPengiriman: "Rabu",
    },
  });

  const siti = await prisma.pelanggan.create({
    data: {
      nama: "Siti Aminah",
      telepon: "081234567890",
      alamat: "Jl. Mawar No. 12, Bandung",
    },
  });
  const budi = await prisma.pelanggan.create({
    data: {
      nama: "Budi Santoso",
      telepon: "081298765432",
      alamat: "Jl. Kenanga No. 8, Bandung",
    },
  });

  // Siti: langganan aktif Paket Keluarga + 1 order lunas.
  const lgSiti = await prisma.langganan.create({
    data: {
      pelangganId: siti.id,
      paketId: keluarga.id,
      tanggalMulai: "2026-09-07",
      status: "AKTIF",
      createdAt: nowIso(),
    },
  });
  const orderSiti = await prisma.order.create({
    data: {
      langgananId: lgSiti.id,
      minggu: "2026-09-21",
      paketId: keluarga.id,
      namaPaket: keluarga.nama,
      hargaSnapshot: keluarga.hargaMingguan,
      tanggalKirim: "2026-09-26",
      statusOrder: "DIKIRIM",
      statusBayar: "LUNAS",
      createdAt: nowIso(),
    },
  });
  await prisma.pembayaran.create({
    data: {
      orderId: orderSiti.id,
      tanggal: "2026-09-26",
      jumlah: keluarga.hargaMingguan,
      metode: "simulasi",
      status: "LUNAS",
      keterangan: "Pembayaran simulasi",
    },
  });

  // Budi: riwayat gagal bayar — 1 order GAGAL (reminder H+3) + 1 order LUNAS lama.
  const lgBudi = await prisma.langganan.create({
    data: {
      pelangganId: budi.id,
      paketId: hemat.id,
      tanggalMulai: "2026-08-31",
      status: "AKTIF",
      createdAt: nowIso(),
    },
  });
  const orderGagal = await prisma.order.create({
    data: {
      langgananId: lgBudi.id,
      minggu: "2026-09-21",
      paketId: hemat.id,
      namaPaket: hemat.nama,
      hargaSnapshot: hemat.hargaMingguan,
      tanggalKirim: "2026-09-26",
      statusOrder: "DIKIRIM",
      statusBayar: "GAGAL",
      reminderStage: 2,
      createdAt: nowIso(),
    },
  });
  await prisma.pembayaran.create({
    data: {
      orderId: orderGagal.id,
      tanggal: "2026-09-26",
      jumlah: hemat.hargaMingguan,
      metode: "simulasi",
      status: "GAGAL",
      keterangan: "Simulasi pembayaran gagal",
    },
  });
  const orderLama = await prisma.order.create({
    data: {
      langgananId: lgBudi.id,
      minggu: "2026-09-14",
      paketId: hemat.id,
      namaPaket: hemat.nama,
      hargaSnapshot: hemat.hargaMingguan,
      tanggalKirim: "2026-09-19",
      statusOrder: "DIKIRIM",
      statusBayar: "LUNAS",
      createdAt: nowIso(),
    },
  });
  await prisma.pembayaran.create({
    data: {
      orderId: orderLama.id,
      tanggal: "2026-09-19",
      jumlah: hemat.hargaMingguan,
      metode: "simulasi",
      status: "LUNAS",
      keterangan: "Pembayaran simulasi",
    },
  });

  console.log("seed selesai: 3 paket, 2 pelanggan, 3 order");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
