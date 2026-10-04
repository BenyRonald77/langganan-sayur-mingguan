# PRD — Langganan Sayur Mingguan

## Ringkasan
Aplikasi web untuk mengelola langganan paket sayur mingguan: katalog paket,
pendaftaran langganan pelanggan, generator order pengiriman otomatis per siklus
mingguan, skip/pause/ganti paket dengan prorata, pembayaran simulasi, pengingat
pembayaran bertahap (H+1/H+3/H+7) dengan penghentian otomatis, serta riwayat
order dan pembayaran.

## Stack
Next.js 14 + TypeScript + Prisma 5.22 + SQLite + Tailwind. App Router, API di
`app/api/**/route.ts`, alias `@/*`, singleton Prisma di `lib/prisma.ts`, seed
via `tsx`. UI berbahasa Indonesia. Prisma 5.22 + SQLite tidak mendukung tipe
`Json` — field JSON disimpan sebagai `String` (JSON-encoded) dan di-parse/
stringify di boundary API.

## Model Data
- **Paket**: id, nama, deskripsi, items (String JSON-encoded array nama sayur),
  hargaMingguan (Int, rupiah), hariPengiriman (nama hari Indonesia),
  aktif (Boolean).
- **Pelanggan**: id, nama, telepon, alamat, catatan.
- **Langganan**: id, pelangganId, paketId, tanggalMulai (YYYY-MM-DD),
  status (`AKTIF` | `PAUSE` | `BERHENTI`).
- **SkipMinggu**: id, langgananId, minggu (YYYY-MM-DD Senin), unique(langgananId, minggu).
- **Order**: id, langgananId, minggu (Senin YYYY-MM-DD), paketId, namaPaket
  (snapshot), hargaSnapshot (Int), tanggalKirim (YYYY-MM-DD),
  statusOrder (`TERJADWAL` | `DIKIRIM` | `DIBATALKAN`),
  statusBayar (`BELUM_BAYAR` | `LUNAS` | `GAGAL`), reminderStage (Int 0..3).
  unique(langgananId, minggu).
- **Pembayaran**: id, orderId, tanggal, jumlah, metode, status (`LUNAS` | `GAGAL`), keterangan.
- **Penyesuaian**: id, langgananId, orderId (nullable), tipe (`PRORATA`),
  jumlah (Int, boleh negatif), keterangan, tanggal.

## Aturan Bisnis
1. **Generator siklus** (`POST /api/generator {minggu?}`): untuk setiap
   langganan `AKTIF` yang tanggalMulainya ≤ tanggalKirim minggu tersebut dan
   belum ada record SkipMinggu untuk minggu itu, buat satu Order (snapshot
   paket saat ini). Idempoten: order dengan (langgananId, minggu) yang sudah
   ada tidak dibuat ulang — run kedua minggu yang sama menghasilkan 0 order
   baru (laporan `dibuat`, `dilewati_skip`, `duplikat`).
2. **Skip 1 minggu** (`POST /api/langganan/[id]/skip {minggu}`): mencatat
   SkipMinggu; jika order minggu itu sudah terlanjur dibuat → 409.
3. **Pause/Resume**: langganan `PAUSE` tidak ikut generator sampai `resume`
   (kembali `AKTIF`).
4. **Ganti paket + prorata** (`POST /api/langganan/[id]/ganti-paket
   {paketBaruId, tanggal?}`): paket langganan diganti. Jika order minggu
   berjalan masih `TERJADWAL`, snapshot order diperbarui ke paket baru dan
   selisih harga dihitung proporsional terhadap sisa hari dalam minggu
   (Senin–Minggu): `selisih = round((hargaBaru - hargaLama) * sisaHari / 7)`,
   dicatat sebagai Penyesuaian tipe `PRORATA` (positif = tagihan tambahan,
   negatif = kredit). Jika paket baru tidak ada → 404; paket tidak aktif → 400.
5. **Pembayaran** (`POST /api/orders/[id]/bayar {status, metode?}`): `LUNAS`
   → statusBayar `LUNAS` + record Pembayaran; `GAGAL` → statusBayar `GAGAL` +
   record Pembayaran (reminderStage tetap 0, pengingat diproses oleh runner).
6. **Pengingat bertahap** (`POST /api/reminders/run {tanggal?}`): untuk order
   dengan statusBayar `GAGAL` dan belum dibatalkan, hitung hari keterlambatan
   dari tanggalKirim. H+1 → reminderStage 1, H+3 → stage 2, H+7 → stage 3
   **dan** langganan otomatis `BERHENTI`. Berjalan idempoten per stage.
7. Order yang sudah `LUNAS`/`GAGAL` tidak diproses ulang oleh generator.

## Halaman
- `/` — katalog paket (kartu paket + tombol "Berlangganan").
- `/berlangganan` — form pendaftaran langganan (pilih paket, data pelanggan,
  tanggal mulai).
- `/langganan-saya` — pilih pelanggan, lihat langganan aktif + aksi
  skip minggu / pause / resume / ganti paket; daftar order + tombol bayar.
- `/riwayat` — riwayat order + pembayaran per pelanggan.
- `/admin` — kelola paket (CRUD), daftar langganan, jalankan generator siklus,
  jalankan pengingat, daftar penyesuaian tagihan.

## API
- `GET/POST /api/paket`, `PATCH/DELETE /api/paket/[id]`
- `GET/POST /api/pelanggan`, `GET /api/pelanggan/[id]`
- `POST /api/langganan` (subscribe → 201)
- `POST /api/langganan/[id]/pause`, `.../resume`, `.../skip`, `.../ganti-paket`
- `POST /api/generator`
- `GET /api/orders?langgananId=`, `POST /api/orders/[id]/bayar`, `POST /api/orders/[id]/kirim`
- `POST /api/reminders/run`
- `GET /api/penyesuaian?langgananId=`

## Seed
3 paket (Hemat Rp35rb, Keluarga Rp60rb, Organik Premium Rp95rb), 2 pelanggan:
Siti Aminah (langganan aktif Paket Keluarga) dan Budi Santoso (riwayat gagal
bayar: 1 order GAGAL dengan reminderStage 2 + 1 order LUNAS lama).

## Kriteria Selesai
`npm run build` lolos; semua endpoint kunci teruji curl (sukses + error
400/404/409); idempotensi generator terbukti; prorata tercatat benar;
alur gagal bayar → reminder H+1/H+3/H+7 → auto-cancel terverifikasi.
