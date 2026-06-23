// Pool list helpers.

import type { Pool } from "./types.ts";

export function byDenom(pools: Pool[], denom: number): Pool | undefined {
  return pools.find((p) => p.denom === denom);
}
export function byContractId(pools: Pool[], contractId: string): Pool | undefined {
  return pools.find((p) => p.contractId === contractId);
}
export function byScope(pools: Pool[], scope: string): Pool | undefined {
  return pools.find((p) => p.scope === scope);
}
export function denoms(pools: Pool[]): number[] {
  return pools.map((p) => p.denom).sort((a, b) => a - b);
}
export function sortByDenom(pools: Pool[]): Pool[] {
  return [...pools].sort((a, b) => a.denom - b.denom);
}
export function smallest(pools: Pool[]): Pool | undefined {
  return sortByDenom(pools)[0];
}
export function largest(pools: Pool[]): Pool | undefined {
  return sortByDenom(pools)[pools.length - 1];
}
export function requirePool(pools: Pool[], denom: number): Pool {
  const p = byDenom(pools, denom);
  if (!p) throw new Error(`no pool for denomination ${denom}`);
  return p;
}
export function contractIds(pools: Pool[]): string[] {
  return pools.map((p) => p.contractId);
}
export function count(pools: Pool[]): number {
  return pools.length;
}
