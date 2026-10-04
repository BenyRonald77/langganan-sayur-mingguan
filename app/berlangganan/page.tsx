"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { rupiah, today } from "@/lib/format";

interface Paket {
  id: number;
  nama: string;
  hargaMingguan: number;
  hariPengiriman: string;
  aktif: boolean;
}

function Form() {
  const sp = useSearchParams();
  const [paket, setPaket] = useState<Paket[]>([]);
  const [paketId, setPaketId] = useState(sp.get("paket") ?? "");
  const [nama, setNama] = useState("");
  const [telepon, setTelepon] = useState("");
  const [alamat, setAlamat] = useState("");
  const [tanggalMulai, setTanggalMulai] = useState(today());
  const [pelangganLama, setPelangganLama] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/paket")
      .then((r) => r.json())
      .then((d) => setPaket(Array.isArray(d) ? d.filter((p: Paket) => p.aktif) : []));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    let pid: number;
    if (pelangganLama) {
      pid = Number(pelangganLama);
    } else {
      const r = await fetch("/api/pelanggan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, telepon, alamat }),
      });
      const d = await r.json();
      if (!r.ok) {
        setMsg("Gagal: " + d.error);
        return;
      }
      pid = d.id;
    }
    const r2 = await fetch("/api/langganan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pelangganId: pid, paketId: Number(paketId), tanggalMulai }),
    });
    const d2 = await r2.json();
    if (!r2.ok) {
      setMsg("Gagal: " + d2.error);
      return;
    }
    setMsg("Berhasil berlangganan! ID langganan: " + d2.id);
  };

  const input = "border rounded px-3 py-2 w-full";
  return (
    <form onSubmit={submit} className="bg-white rounded-lg shadow p-6 max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Form Berlangganan</h1>
      <div>
        <label className="text-sm font-medium">Paket</label>
        <select value={paketId} onChange={(e) => setPaketId(e.target.value)} className={input} required>
          <option value="">-- pilih paket --</option>
          {paket.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama} — {rupiah(p.hargaMingguan)}/minggu (kirim {p.hariPengiriman})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">ID Pelanggan lama (opsional, isi jika sudah terdaftar)</label>
        <input value={pelangganLama} onChange={(e) => setPelangganLama(e.target.value)} className={input} placeholder="cth: 1" />
      </div>
      {!pelangganLama && (
        <>
          <div>
            <label className="text-sm font-medium">Nama</label>
            <input value={nama} onChange={(e) => setNama(e.target.value)} className={input} required />
          </div>
          <div>
            <label className="text-sm font-medium">Telepon</label>
            <input value={telepon} onChange={(e) => setTelepon(e.target.value)} className={input} required />
          </div>
          <div>
            <label className="text-sm font-medium">Alamat</label>
            <textarea value={alamat} onChange={(e) => setAlamat(e.target.value)} className={input} />
          </div>
        </>
      )}
      <div>
        <label className="text-sm font-medium">Tanggal mulai</label>
        <input type="date" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} className={input} required />
      </div>
      <button className="bg-green-700 text-white rounded px-4 py-2 hover:bg-green-800">
        Daftarkan Langganan
      </button>
      {msg && <p className="text-sm font-medium">{msg}</p>}
    </form>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p>Memuat...</p>}>
      <Form />
    </Suspense>
  );
}
