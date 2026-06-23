// Formatting helpers for the indexer's API responses and logs.

export function xlm(stroops: number | bigint | string): string {
  return `${(Number(BigInt(stroops)) / 1e9).toLocaleString(undefined, { maximumFractionDigits: 4 })} XLM`;
}
export function shortHex(s: string, head = 12): string {
  return s && s.length > head ? `${s.slice(0, head)}…` : s;
}
export function pct(part: number, whole: number): string {
  return whole === 0 ? "0%" : `${((part / whole) * 100).toFixed(1)}%`;
}
export function bigintToString(v: unknown): string {
  return typeof v === "bigint" ? v.toString() : String(v ?? "0");
}
export function toHex(v: unknown): string {
  if (v instanceof Uint8Array) return Buffer.from(v).toString("hex");
  return typeof v === "string" ? v : "";
}
export function len(v: unknown): number {
  return Array.isArray(v) ? v.length : 0;
}
export function nowIso(): string {
  return new Date().toISOString();
}
export function ageMs(ts: number): number {
  return Date.now() - ts;
}
export function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
}
