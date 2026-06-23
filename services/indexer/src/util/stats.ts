// Small numeric/statistics helpers used to aggregate pool snapshots.

export function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}
export function sumBig(xs: string[]): string {
  return xs.reduce((a, b) => a + BigInt(b || "0"), 0n).toString();
}
export function max(xs: number[]): number {
  return xs.reduce((a, b) => Math.max(a, b), Number.NEGATIVE_INFINITY);
}
export function min(xs: number[]): number {
  return xs.reduce((a, b) => Math.min(a, b), Number.POSITIVE_INFINITY);
}
export function mean(xs: number[]): number {
  return xs.length ? sum(xs) / xs.length : 0;
}
export function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
export function ratio(a: number, b: number): number {
  return b === 0 ? 0 : a / b;
}
export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}
export function countWhere<T>(xs: T[], pred: (x: T) => boolean): number {
  return xs.filter(pred).length;
}
export function groupBy<T, K extends string | number>(xs: T[], key: (x: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const x of xs) {
    const k = key(x);
    (out[k] ??= []).push(x);
  }
  return out;
}
