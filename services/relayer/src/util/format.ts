// Formatting helpers for relayer responses and logs.

export function shortHex(s: string, head = 10): string {
  return s && s.length > head ? `${s.slice(0, head)}…` : s;
}
export function shortAddr(a: string): string {
  return a && a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-6)}` : a;
}
export function xlm(stroops: number | bigint | string): string {
  return `${(Number(BigInt(stroops)) / 1e9).toLocaleString(undefined, { maximumFractionDigits: 4 })} XLM`;
}
export function pluralize(n: number, singular: string, plural?: string): string {
  return n === 1 ? `${n} ${singular}` : `${n} ${plural ?? singular + "s"}`;
}
export function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}
export function nowIso(): string {
  return new Date().toISOString();
}
export function durationMs(start: number): string {
  return `${Date.now() - start}ms`;
}
export function jsonLine(obj: unknown): string {
  return JSON.stringify(obj);
}
export function padNum(n: number, width: number): string {
  return n.toString().padStart(width, "0");
}
export function kvLine(key: string, value: unknown): string {
  return `${key}=${String(value)}`;
}
export function listLabel(items: (string | number)[]): string {
  return items.join(", ");
}
export function maskMiddle(s: string, keep = 4): string {
  return s.length <= keep * 2 ? s : `${s.slice(0, keep)}${"•".repeat(6)}${s.slice(-keep)}`;
}
