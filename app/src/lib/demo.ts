// Demo mode — lets Veil run as a fully interactive standalone dapp with no relayer,
// indexer, or deployed contracts. When enabled, the data layer serves realistic
// in-memory state so the deposit -> note -> withdraw flow works end to end and every
// screen is populated. This is what powers the public demo deployment and the walkthrough
// video. Turn it off in Settings to point the app at a real backend.

import { getSettings } from "./settings.ts";
import { DENOMS } from "./amount.ts";

export function demoEnabled(): boolean {
  return getSettings().demo;
}

/** Random lowercase hex of `bytes` length. Browser crypto, deterministic-free. */
export function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

// A plausible-looking Soroban contract id (C... strkey-ish) for display only.
function fakeContractId(seed: string): string {
  const body = (seed + randomHex(32)).toUpperCase().replace(/[^A-Z2-7]/g, "").slice(0, 55);
  return `C${body.padEnd(55, "Z")}`;
}

export const DEMO_ADDRESS = "GDEMO7VEILXKQ2ZJ5W3K4M6N8P9Q1R3S5T7U9V2W4X6Y8Z1A3B5C7D9";

export interface DemoPool {
  contractId: string;
  denom: number;
  scope: string;
  commitmentCount: number;
  nullifierCount: number;
  balanceStroops: number;
}

// Stable per-session pool set. Built once so contract ids stay constant across reads.
const POOLS: DemoPool[] = DENOMS.map((denom, i) => {
  const deposits = [128, 64, 31, 12][i] ?? 8;
  const withdrawals = [97, 41, 18, 5][i] ?? 3;
  return {
    contractId: fakeContractId(`VEIL${i}`),
    denom,
    scope: `veil.pool.${denom}`,
    commitmentCount: deposits,
    nullifierCount: withdrawals,
    balanceStroops: (deposits - withdrawals) * denom,
  };
});

export function demoPools(): DemoPool[] {
  return POOLS;
}

export function demoPool(denom: number): DemoPool | undefined {
  return POOLS.find((p) => p.denom === denom);
}

/** Aggregate stats matching the indexer's Stats shape. */
export function demoStats() {
  const totalCommitments = POOLS.reduce((s, p) => s + p.commitmentCount, 0);
  const totalWithdrawals = POOLS.reduce((s, p) => s + p.nullifierCount, 0);
  const totalLocked = POOLS.reduce((s, p) => s + p.balanceStroops, 0);
  return {
    pools: POOLS.map((p) => ({
      contractId: p.contractId,
      denom: p.denom,
      scope: p.scope,
      commitmentCount: p.commitmentCount,
      nullifierCount: p.nullifierCount,
      merkleRoot: randomHex(32),
      balance: String(p.balanceStroops),
      rootHistorySize: 30,
      lastUpdated: Date.now(),
    })),
    totalCommitments,
    totalWithdrawals,
    totalLocked: String(totalLocked),
  };
}

/** A coin note shaped like the real relayer's note, all secret fields random. */
export function demoMintNote(denom: number) {
  const pool = demoPool(denom) ?? POOLS[0];
  const commitmentHex = randomHex(32);
  const note = {
    denom,
    scope: pool.scope,
    nullifier: randomHex(31),
    secret: randomHex(31),
    commitment: commitmentHex,
    leafIndex: pool.commitmentCount,
    network: getSettings().network,
    demo: true,
  };
  return { note, commitmentHex, denom, contractId: pool.contractId, scope: pool.scope };
}

/** Pretend a deposit landed: bump the pool's commitment count, return a tx hash. */
export function demoRecordDeposit(denom: number): { hash: string } {
  const pool = demoPool(denom);
  if (pool) {
    pool.commitmentCount += 1;
    pool.balanceStroops += denom;
  }
  return { hash: randomHex(32) };
}

/** Pretend a withdrawal landed: bump nullifiers, return a tx hash. */
export function demoRecordWithdraw(denom: number): { hash: string } {
  const pool = demoPool(denom);
  if (pool && pool.nullifierCount < pool.commitmentCount) {
    pool.nullifierCount += 1;
    pool.balanceStroops = Math.max(0, pool.balanceStroops - denom);
  }
  return { hash: randomHex(32) };
}

/** Small artificial delay so demo steps feel like real network/chain work. */
export function demoDelay<T>(value: T, ms = 700): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
