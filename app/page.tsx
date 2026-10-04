"use client";
import { useEffect, useState } from "react";
import { rupiah } from "@/lib/format";

interface Paket {
  id: number;
  nama: string;
  deskripsi: string;
  items: string[];
  hargaMingguan: number;
  hariPengiriman: string;
  aktif: boolean;
}

export default function Katalog() {
  const [paket, setPaket] = useState<Paket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/paket")
      .then((r) => r.json())
      .then((d) => {
        setPaket(Array.isArray(d) ? d.filter((p: Paket) => p.aktif) : []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Katalog Paket Sayur Mingguan</h1>
      <p className="text-slate-600 mb-6">
        Pilih paket langganan sayur segar yang diantar rutin setiap minggu.
      </p>
      {loading ? (
        <p>Memuat...</p>
      ) : paket.length === 0 ? (
        <p className="text-slate-500">Belum ada paket aktif.</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {paket.map((p) => (
            <div key={p.id} className="bg-white rounded-lg shadow p-5 flex flex-col">
              <h2 className="font-bold text-lg">{p.nama}</h2>
              <p className="text-sm text-slate-600 mt-1">{p.deskripsi}</p>
              <ul className="text-sm mt-3 space-y-1 flex-1">
                {p.items.map((it, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-green-600">✓</span> {it}
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-3 border-t">
                <div className="font-bold text-green-700 text-xl">
                  {rupiah(p.hargaMingguan)}
                  <span className="text-sm font-normal text-slate-500"> /minggu</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Pengiriman: {p.hariPengiriman}
                </div>
                <a
                  href={`/berlangganan?paket=${p.id}`}
                  className="mt-3 block text-center bg-green-700 text-white rounded px-4 py-2 hover:bg-green-800"
                >
                  Berlangganan
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
