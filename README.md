# Langganan Sayur Mingguan

Aplikasi web untuk mengelola langganan paket sayur mingguan: katalog paket,
pendaftaran langganan, generator order pengiriman otomatis per siklus mingguan
(idempoten), skip 1 minggu, pause/resume, ganti paket dengan hitungan prorata,
pembayaran simulasi, pengingat pembayaran bertahap (H+1/H+3/H+7) dengan
penghentian langganan otomatis, serta riwayat order dan pembayaran.

Stack: Next.js 14 + TypeScript + Prisma 5.22 + SQLite + Tailwind.

## Cara Menjalankan

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

## Halaman

- `/` — katalog paket (kartu paket + tombol berlangganan)
- `/berlangganan` — form pendaftaran langganan
- `/langganan-saya` — langganan per pelanggan: skip minggu, pause/resume,
  ganti paket (prorata), bayar order
- `/riwayat` — riwayat order + pembayaran per pelanggan
- `/admin` — kelola paket, daftar langganan, generator siklus, pengingat

## API

- `GET/POST /api/paket`, `PATCH/DELETE /api/paket/[id]`
- `GET/POST /api/pelanggan`, `GET /api/pelanggan/[id]`
- `POST /api/langganan` — daftar langganan baru (201)
- `POST /api/langganan/[id]?aksi=pause|resume`
- `POST /api/langganan/[id]/skip` — skip 1 minggu
- `POST /api/langganan/[id]/ganti-paket` — ganti paket + prorata
- `POST /api/generator` — buat order untuk semua langganan aktif (idempoten)
- `GET /api/orders`, `POST /api/orders/[id]/bayar`, `POST /api/orders/[id]/kirim`
- `POST /api/reminders/run` — pengingat H+1/H+3/H+7, auto-cancel setelah H+7
- `GET /api/penyesuaian`

Lihat `PRD.md` untuk aturan bisnis lengkap.
