// Amount helpers — this project treats 1 XLM = 1_000_000_000 stroops.

export const STROOPS_PER_UNIT = 1_000_000_000;
export const DENOMS = [1_000_000_000, 10_000_000_000, 100_000_000_000, 1_000_000_000_000];

export function toUnits(stroops: number | string): number {
  return Number(stroops) / STROOPS_PER_UNIT;
}

export function fromUnits(units: number): number {
  return Math.round(units * STROOPS_PER_UNIT);
}

export function formatUnits(stroops: number | string, maxFrac = 4): string {
  return toUnits(stroops).toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}

export function formatXlm(stroops: number | string): string {
  return `${formatUnits(stroops)} XLM`;
}

export function parseUnits(s: string): number | null {
  const n = Number(s.trim());
  return Number.isFinite(n) ? fromUnits(n) : null;
}

export function isSupportedDenom(stroops: number): boolean {
  return DENOMS.includes(stroops);
}

export function denomIndex(stroops: number): number {
  return DENOMS.indexOf(stroops);
}

export function denomLabel(stroops: number): string {
  return `${formatUnits(stroops)} XLM`;
}

export function largestDenomBelow(stroops: number): number | null {
  for (let i = DENOMS.length - 1; i >= 0; i--) if (DENOMS[i] <= stroops) return DENOMS[i];
  return null;
}

export function decompose(stroops: number): number[] {
  const out: number[] = [];
  let rem = stroops;
  for (let i = DENOMS.length - 1; i >= 0; i--) {
    while (rem >= DENOMS[i]) {
      out.push(DENOMS[i]);
      rem -= DENOMS[i];
    }
  }
  return out;
}

export function sum(amounts: number[]): number {
  return amounts.reduce((a, b) => a + b, 0);
}

export function feeBps(stroops: number, bps: number): number {
  return Math.floor((stroops * bps) / 10_000);
}

export function afterFeeBps(stroops: number, bps: number): number {
  return stroops - feeBps(stroops, bps);
}

export function isPositive(stroops: number): boolean {
  return stroops > 0;
}

export function clampDenom(stroops: number): number {
  return Math.min(Math.max(stroops, DENOMS[0]), DENOMS[DENOMS.length - 1]);
}

export function nextDenom(stroops: number): number {
  const i = denomIndex(stroops);
  return i >= 0 && i < DENOMS.length - 1 ? DENOMS[i + 1] : stroops;
}

export function prevDenom(stroops: number): number {
  const i = denomIndex(stroops);
  return i > 0 ? DENOMS[i - 1] : stroops;
}

export function compactUnits(stroops: number | string): string {
  const u = toUnits(stroops);
  if (u >= 1_000_000) return `${(u / 1_000_000).toFixed(1)}M`;
  if (u >= 1_000) return `${(u / 1_000).toFixed(1)}k`;
  return `${u}`;
}
