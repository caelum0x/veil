// Amount helpers — 1 XLM = 1_000_000_000 stroops in this project.

export const STROOPS_PER_UNIT = 1_000_000_000;
export const DENOMS = [1_000_000_000, 10_000_000_000, 100_000_000_000, 1_000_000_000_000];

export function toUnits(stroops: number | bigint | string): number {
  return Number(BigInt(stroops)) / STROOPS_PER_UNIT;
}
export function fromUnits(units: number): number {
  return Math.round(units * STROOPS_PER_UNIT);
}
export function format(stroops: number | bigint | string, maxFrac = 4): string {
  return toUnits(stroops).toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}
export function formatXlm(stroops: number | bigint | string): string {
  return `${format(stroops)} XLM`;
}
export function isSupportedDenom(stroops: number): boolean {
  return DENOMS.includes(stroops);
}
export function denomIndex(stroops: number): number {
  return DENOMS.indexOf(stroops);
}
export function denomScope(stroops: number): string {
  return `veil_pool_${stroops}`;
}
export function denomLabel(stroops: number): string {
  return `${format(stroops)} XLM`;
}
export function largestDenomBelow(stroops: number): number | null {
  for (let i = DENOMS.length - 1; i >= 0; i--) if (DENOMS[i] <= stroops) return DENOMS[i];
  return null;
}
export function decompose(stroops: number): number[] {
  const out: number[] = [];
  let rem = stroops;
  for (let i = DENOMS.length - 1; i >= 0; i--)
    while (rem >= DENOMS[i]) {
      out.push(DENOMS[i]);
      rem -= DENOMS[i];
    }
  return out;
}
export function sum(amounts: number[]): number {
  return amounts.reduce((a, b) => a + b, 0);
}
export function isPositive(stroops: number): boolean {
  return stroops > 0;
}
export function feeBps(stroops: number, bps: number): number {
  return Math.floor((stroops * bps) / 10_000);
}
export function afterFeeBps(stroops: number, bps: number): number {
  return stroops - feeBps(stroops, bps);
}
export function clampDenom(stroops: number): number {
  return Math.min(Math.max(stroops, DENOMS[0]), DENOMS[DENOMS.length - 1]);
}
export function compact(stroops: number | string): string {
  const u = toUnits(stroops);
  if (u >= 1_000_000) return `${(u / 1_000_000).toFixed(1)}M`;
  if (u >= 1_000) return `${(u / 1_000).toFixed(1)}k`;
  return `${u}`;
}
