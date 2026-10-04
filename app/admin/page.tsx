"use client";
import { useEffect, useState } from "react";
import { rupiah, today, weekMonday } from "@/lib/format";

export default function Admin() {
  const [paket, setPaket] = useState<any[]>([]);
  const [langganan, setLangganan] = useState<any[]>([]);
  const [minggu, setMinggu] = useState(weekMonday(today()));
  const [tglReminder, setTglReminder] = useState(today());
  const [hasil, setHasil] = useState("");
  const [form, setForm] = useState({ nama: "", deskripsi: "", items: "", hargaMingguan: "", hariPengiriman: "Sabtu" });

  const muat = async () => {
    const p = await fetch("/api/paket").then((r) => r.json());
    setPaket(Array.isArray(p) ? p : []);
    const l = await fetch("/api/langganan").then((r) => r.json());
    setLangganan(Array.isArray(l) ? l : []);
  };
  useEffect(() => { muat(); }, []);

  const run = async (url: string, body?: any) => {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const d = await r.json();
    setHasil(JSON.stringify(d, null, 2));
    await muat();
  };

  const tambahPaket = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = form.items.split("\n").map((s) => s.trim()).filter(Boolean);
    const r = await fetch("/api/paket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama: form.nama, deskripsi: form.deskripsi, items, hargaMingguan: Number(form.hargaMingguan), hariPengiriman: form.hariPengiriman }),
    });
    const d = await r.json();
    setHasil(r.ok ? "Paket dibuat: " + d.nama : "Gagal: " + d.error);
    setForm({ nama: "", deskripsi: "", items: "", hargaMingguan: "", hariPengiriman: "Sabtu" });
    await muat();
  };

  const input = "border rounded px-2 py-1 text-sm w-full";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin</h1>

      <section className="bg-white rounded shadow p-4">
        <h2 className="font-bold mb-2">Generator Siklus Mingguan</h2>
        <div className="flex gap-2 items-end">
          <div>
            <label className="text-xs">Minggu (Senin)</label>
            <input type="date" value={minggu} onChange={(e) => setMinggu(e.target.value)} className="border rounded px-2 py-1 text-sm block" />
          </div>
          <button onClick={() => run("/api/generator", { minggu })} className="bg-blue-600 text-white rounded px-4 py-1.5 text-sm">
            Jalankan Generator
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-1">Idempoten: minggu yang sama tidak membuat duplikat.</p>
      </section>

      <section className="bg-white rounded shadow p-4">
        <h2 className="font-bold mb-2">Pengingat Pembayaran Bertahap</h2>
        <div className="flex gap-2 items-end">
          <div>
            <label className="text-xs">Tanggal evaluasi</label>
            <input type="date" value={tglReminder} onChange={(e) => setTglReminder(e.target.value)} className="border rounded px-2 py-1 text-sm block" />
          </div>
          <button onClick={() => run("/api/reminders/run", { tanggal: tglReminder })} className="bg-orange-600 text-white rounded px-4 py-1.5 text-sm">
            Jalankan Pengingat
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-1">H+1 / H+3 / H+7 untuk order GAGAL; setelah H+7 langganan dihentikan otomatis.</p>
      </section>

      {hasil && (
        <section className="bg-slate-900 text-green-200 rounded shadow p-4">
          <h2 className="font-bold mb-2 text-white">Hasil</h2>
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap">{hasil}</pre>
        </section>
      )}

      <section className="bg-white rounded shadow p-4">
        <h2 className="font-bold mb-2">Kelola Paket</h2>
        <table className="w-full text-sm mb-4">
          <thead><tr className="text-left text-slate-500"><th>Nama</th><th className="text-right">Harga/minggu</th><th>Kirim</th><th>Aktif</th><th>Aksi</th></tr></thead>
          <tbody>
            {paket.map((p) => (
              <tr key={p.id} className="border-t">
                <td>{p.nama}</td>
                <td className="text-right">{rupiah(p.hargaMingguan)}</td>
                <td>{p.hariPengiriman}</td>
                <td>{p.aktif ? "Ya" : "Tidak"}</td>
                <td>
                  <button onClick={async () => { const r = await fetch(`/api/paket/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ aktif: !p.aktif }) }); setHasil(JSON.stringify(await r.json(), null, 2)); await muat(); }} className="text-xs bg-slate-200 rounded px-2 py-1">
                    {p.aktif ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <form onSubmit={tambahPaket} className="grid md:grid-cols-2 gap-2 max-w-2xl">
          <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama paket" className={input} required />
          <input value={form.hargaMingguan} onChange={(e) => setForm({ ...form, hargaMingguan: e.target.value })} placeholder="Harga per minggu (angka)" type="number" className={input} required />
          <input value={form.hariPengiriman} onChange={(e) => setForm({ ...form, hariPengiriman: e.target.value })} placeholder="Hari pengiriman" className={input} />
          <input value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} placeholder="Deskripsi" className={input} />
          <textarea value={form.items} onChange={(e) => setForm({ ...form, items: e.target.value })} placeholder="Isi paket, satu item per baris" className={input + " md:col-span-2"} rows={3} />
          <button className="bg-green-700 text-white rounded px-4 py-1.5 text-sm md:col-span-2">Tambah Paket</button>
        </form>
      </section>

      <section className="bg-white rounded shadow p-4">
        <h2 className="font-bold mb-2">Semua Langganan</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-500"><th>ID</th><th>Pelanggan</th><th>Paket</th><th>Mulai</th><th>Status</th></tr></thead>
          <tbody>
            {langganan.map((l) => (
              <tr key={l.id} className="border-t">
                <td>{l.id}</td><td>{l.pelanggan?.nama}</td><td>{l.paket?.nama}</td><td>{l.tanggalMulai}</td><td>{l.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
