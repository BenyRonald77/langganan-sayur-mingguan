"use client";
import { useEffect, useState } from "react";
import { rupiah, today, weekMonday } from "@/lib/format";

interface Paket {
  id: number;
  nama: string;
  hargaMingguan: number;
  aktif: boolean;
}
interface Langganan {
  id: number;
  paketId: number;
  tanggalMulai: string;
  status: string;
  paket: Paket;
}
interface Order {
  id: number;
  minggu: string;
  namaPaket: string;
  hargaSnapshot: number;
  tanggalKirim: string;
  statusOrder: string;
  statusBayar: string;
  reminderStage: number;
}

export default function LanggananSaya() {
  const [pelangganId, setPelangganId] = useState("");
  const [data, setData] = useState<any>(null);
  const [paket, setPaket] = useState<Paket[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [penyesuaian, setPenyesuaian] = useState<any[]>([]);
  const [mingguSkip, setMingguSkip] = useState(weekMonday(today()));
  const [ganti, setGanti] = useState<{ [k: number]: string }>({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/paket")
      .then((r) => r.json())
      .then((d) => setPaket(Array.isArray(d) ? d.filter((p: Paket) => p.aktif) : []));
  }, []);

  const muat = async () => {
    if (!pelangganId) return;
    setMsg("");
    const r = await fetch(`/api/pelanggan/${pelangganId}`);
    const d = await r.json();
    if (!r.ok) {
      setMsg("Gagal: " + d.error);
      setData(null);
      return;
    }
    setData(d);
    const ro = await fetch(`/api/orders?pelangganId=${pelangganId}`).then((x) => x.json());
    setOrders(Array.isArray(ro) ? ro : []);
    const rp = await fetch(`/api/penyesuaian?langgananId=`).then(() => null);
    void rp;
  };

  const aksi = async (url: string, body?: any, method = "POST") => {
    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const d = await r.json();
    setMsg(r.ok ? "Berhasil: " + JSON.stringify(d.penyesuaian !== undefined ? { penyesuaian: d.penyesuaian } : d.id ?? d.ok ?? d.aksi ?? "OK") : "Gagal: " + d.error);
    await muat();
  };

  const muatPenyesuaian = async (lgId: number) => {
    const r = await fetch(`/api/penyesuaian?langgananId=${lgId}`).then((x) => x.json());
    setPenyesuaian(Array.isArray(r) ? r : []);
  };

  const badge = (s: string) => {
    const c: { [k: string]: string } =
      {
        AKTIF: "bg-green-100 text-green-800",
        PAUSE: "bg-yellow-100 text-yellow-800",
        BERHENTI: "bg-red-100 text-red-800",
        LUNAS: "bg-green-100 text-green-800",
        GAGAL: "bg-red-100 text-red-800",
        BELUM_BAYAR: "bg-slate-200 text-slate-700",
        TERJADWAL: "bg-blue-100 text-blue-800",
        DIKIRIM: "bg-green-100 text-green-800",
        DIBATALKAN: "bg-slate-200 text-slate-500",
      };
    return <span className={`text-xs px-2 py-0.5 rounded ${c[s] ?? "bg-slate-100"}`}>{s.replace("_", " ")}</span>;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Langganan Saya</h1>
      <div className="flex gap-2 mb-4">
        <input
          value={pelangganId}
          onChange={(e) => setPelangganId(e.target.value)}
          placeholder="Masukkan ID pelanggan (cth: 1)"
          className="border rounded px-3 py-2 w-64"
        />
        <button onClick={muat} className="bg-green-700 text-white rounded px-4 py-2">
          Lihat
        </button>
      </div>
      {msg && <p className="text-sm font-medium mb-4">{msg}</p>}
      {data && (
        <div className="space-y-6">
          <div className="bg-white rounded shadow p-4">
            <h2 className="font-bold text-lg">{data.nama}</h2>
            <p className="text-sm text-slate-600">{data.telepon} — {data.alamat}</p>
          </div>
          {data.langganan.map((lg: Langganan) => (
            <div key={lg.id} className="bg-white rounded shadow p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-bold">{lg.paket.nama}</span> {badge(lg.status)}
                  <div className="text-sm text-slate-600">
                    {rupiah(lg.paket.hargaMingguan)}/minggu • mulai {lg.tanggalMulai}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {lg.status === "AKTIF" && (
                    <button onClick={() => aksi(`/api/langganan/${lg.id}?aksi=pause`)} className="text-sm bg-yellow-500 text-white rounded px-3 py-1">
                      Pause
                    </button>
                  )}
                  {lg.status === "PAUSE" && (
                    <button onClick={() => aksi(`/api/langganan/${lg.id}?aksi=resume`)} className="text-sm bg-green-600 text-white rounded px-3 py-1">
                      Resume
                    </button>
                  )}
                  <button onClick={() => muatPenyesuaian(lg.id)} className="text-sm bg-slate-200 rounded px-3 py-1">
                    Penyesuaian
                  </button>
                </div>
              </div>
              {lg.status === "AKTIF" && (
                <div className="mt-3 pt-3 border-t grid md:grid-cols-2 gap-3">
                  <div className="flex gap-2 items-end">
                    <div>
                      <label className="text-xs">Skip minggu (Senin)</label>
                      <input type="date" value={mingguSkip} onChange={(e) => setMingguSkip(e.target.value)} className="border rounded px-2 py-1 text-sm block" />
                    </div>
                    <button onClick={() => aksi(`/api/langganan/${lg.id}/skip`, { minggu: mingguSkip })} className="text-sm bg-orange-500 text-white rounded px-3 py-1.5">
                      Skip 1 minggu
                    </button>
                  </div>
                  <div className="flex gap-2 items-end">
                    <div>
                      <label className="text-xs">Ganti paket (prorata)</label>
                      <select value={ganti[lg.id] ?? ""} onChange={(e) => setGanti({ ...ganti, [lg.id]: e.target.value })} className="border rounded px-2 py-1 text-sm block">
                        <option value="">-- pilih paket baru --</option>
                        {paket.filter((p) => p.id !== lg.paketId).map((p) => (
                          <option key={p.id} value={p.id}>{p.nama} — {rupiah(p.hargaMingguan)}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => ganti[lg.id] && aksi(`/api/langganan/${lg.id}/ganti-paket`, { paketBaruId: Number(ganti[lg.id]) })}
                      className="text-sm bg-blue-600 text-white rounded px-3 py-1.5"
                    >
                      Ganti
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {penyesuaian.length > 0 && (
            <div className="bg-white rounded shadow p-4">
              <h3 className="font-bold mb-2">Penyesuaian Tagihan</h3>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-slate-500"><th>Tanggal</th><th>Tipe</th><th>Keterangan</th><th className="text-right">Jumlah</th></tr></thead>
                <tbody>
                  {penyesuaian.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td>{p.tanggal}</td><td>{p.tipe}</td><td>{p.keterangan}</td>
                      <td className={`text-right font-medium ${p.jumlah >= 0 ? "text-red-600" : "text-green-600"}`}>
                        {p.jumlah >= 0 ? "+" : "−"}{rupiah(Math.abs(p.jumlah))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-bold mb-2">Order Pengiriman</h3>
            {orders.length === 0 ? <p className="text-sm text-slate-500">Belum ada order.</p> : (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-slate-500"><th>Minggu</th><th>Paket</th><th>Kirim</th><th className="text-right">Harga</th><th>Order</th><th>Bayar</th><th>Aksi</th></tr></thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-t">
                      <td>{o.minggu}</td><td>{o.namaPaket}</td><td>{o.tanggalKirim}</td>
                      <td className="text-right">{rupiah(o.hargaSnapshot)}</td>
                      <td>{badge(o.statusOrder)}</td>
                      <td>{badge(o.statusBayar)}{o.reminderStage > 0 && <span className="text-xs text-orange-600"> (H+{[1,1,3,7][o.reminderStage]})</span>}</td>
                      <td>
                        {o.statusBayar === "BELUM_BAYAR" && (
                          <button onClick={() => aksi(`/api/orders/${o.id}/bayar`, { status: "LUNAS" })} className="text-xs bg-green-600 text-white rounded px-2 py-1">
                            Bayar (simulasi)
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
