// Amount helpers (stroops <-> XLM), shared conventions with the contract.

export const STROOPS_PER_UNIT = 1_000_000_000;
export const DENOMS = [1_000_000_000, 10_000_000_000, 100_000_000_000, 1_000_000_000_000];

export function toUnits(stroops: number | bigint | string): number {
  return Number(BigInt(stroops)) / STROOPS_PER_UNIT;
}
export function fromUnits(units: number): number {
  return Math.round(units * STROOPS_PER_UNIT);
}
export function formatXlm(stroops: number | bigint | string): string {
  return `${toUnits(stroops).toLocaleString(undefined, { maximumFractionDigits: 4 })} XLM`;
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
export function sum(amounts: number[]): number {
  return amounts.reduce((a, b) => a + b, 0);
}
export function isPositive(stroops: number): boolean {
  return stroops > 0;
}
export function feeBps(stroops: number, bps: number): number {
  return Math.floor((stroops * bps) / 10_000);
}
