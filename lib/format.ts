export const rupiah = (n: number) =>
  "Rp" + Math.round(n).toLocaleString("id-ID");

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

export const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
};

export const nowIso = () => new Date().toISOString();

export const NAMA_HARI = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

// Parse YYYY-MM-DD sebagai tanggal lokal (hindari drama timezone).
export const parseDate = (s: string): Date => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const fmtDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

// Senin dari minggu yang memuat tanggal s (YYYY-MM-DD).
export const weekMonday = (s: string): string => {
  const d = parseDate(s);
  const dow = (d.getDay() + 6) % 7; // Senin=0
  d.setDate(d.getDate() - dow);
  return fmtDate(d);
};

// Selisih hari kalender: b - a.
export const diffDays = (a: string, b: string): number =>
  Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000);

// Tanggal kirim untuk minggu `minggu` (Senin) berdasarkan hari pengiriman paket.
export const tanggalKirimUntukMinggu = (minggu: string, hariPengiriman: string): string => {
  const idx = NAMA_HARI.indexOf(hariPengiriman);
  const offset = idx < 0 ? 5 : (idx + 6) % 7; // default Sabtu bila tidak dikenal
  const d = parseDate(minggu);
  d.setDate(d.getDate() + offset);
  return fmtDate(d);
};

// Sisa hari dalam minggu (Senin..Minggu) terhitung sejak tanggal s (inklusif).
export const sisaHariMinggu = (s: string): number => {
  const d = parseDate(s);
  const dow = (d.getDay() + 6) % 7;
  return 7 - dow;
};

export const parseItems = (items: string): string[] => {
  try {
    const v = JSON.parse(items);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
};

export const stringifyItems = (items: string[]): string => JSON.stringify(items);
