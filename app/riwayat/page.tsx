"use client";
import { useState } from "react";
import { rupiah } from "@/lib/format";

export default function Riwayat() {
  const [pelangganId, setPelangganId] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  const muat = async () => {
    if (!pelangganId) return;
    const r = await fetch(`/api/orders?pelangganId=${pelangganId}`);
    const d = await r.json();
    if (!r.ok) {
      setMsg("Gagal: " + d.error);
      return;
    }
    setOrders(d);
    setMsg("");
  };

  const totalLunas = orders
    .filter((o) => o.statusBayar === "LUNAS")
    .reduce((s, o) => s + o.hargaSnapshot, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Riwayat Order & Pembayaran</h1>
      <div className="flex gap-2 mb-4">
        <input
          value={pelangganId}
          onChange={(e) => setPelangganId(e.target.value)}
          placeholder="ID pelanggan (cth: 1)"
          className="border rounded px-3 py-2 w-64"
        />
        <button onClick={muat} className="bg-green-700 text-white rounded px-4 py-2">Lihat</button>
      </div>
      {msg && <p className="text-sm font-medium mb-4">{msg}</p>}
      {orders.length > 0 && (
        <>
          <p className="text-sm text-slate-600 mb-2">
            Total terbayar: <span className="font-bold text-green-700">{rupiah(totalLunas)}</span>
          </p>
          <div className="bg-white rounded shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="p-2">Minggu</th><th className="p-2">Paket</th>
                  <th className="p-2">Tgl kirim</th><th className="p-2 text-right">Harga</th>
                  <th className="p-2">Bayar</th><th className="p-2">Riwayat pembayaran</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="p-2">{o.minggu}</td>
                    <td className="p-2">{o.namaPaket}</td>
                    <td className="p-2">{o.tanggalKirim}</td>
                    <td className="p-2 text-right">{rupiah(o.hargaSnapshot)}</td>
                    <td className="p-2">{o.statusBayar.replace("_", " ")}{o.reminderStage > 0 ? ` (pengingat H+${[0, 1, 3, 7][o.reminderStage]})` : ""}</td>
                    <td className="p-2 text-xs text-slate-600">
                      {o.pembayaran.length === 0 ? "—" : o.pembayaran.map((p: any) => (
                        <div key={p.id}>{p.tanggal}: {rupiah(p.jumlah)} — {p.status}</div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
