import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Langganan Sayur Mingguan",
  description: "Kelola langganan paket sayur mingguan: order otomatis, skip, pause, prorata, dan pengingat pembayaran.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen text-slate-900">
        <header className="bg-green-700 text-white">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="font-bold text-lg">🥬 SayurLangganan</a>
            <nav className="flex gap-4 text-sm">
              <a href="/" className="hover:underline">Katalog</a>
              <a href="/berlangganan" className="hover:underline">Berlangganan</a>
              <a href="/langganan-saya" className="hover:underline">Langganan Saya</a>
              <a href="/riwayat" className="hover:underline">Riwayat</a>
              <a href="/admin" className="hover:underline">Admin</a>
            </nav>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
