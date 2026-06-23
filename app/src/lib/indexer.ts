import { getSettings } from "./settings.ts";

export interface PoolSnapshot {
  contractId: string;
  denom: number;
  scope: string;
  commitmentCount: number;
  nullifierCount: number;
  merkleRoot: string;
  balance: string;
  rootHistorySize: number;
  lastUpdated: number;
  error?: string;
}

export interface Stats {
  pools: PoolSnapshot[];
  totalCommitments: number;
  totalWithdrawals: number;
  totalLocked: string;
}

function indexer(): string {
  return getSettings().indexerUrl;
}

/** Reads aggregate + per-pool stats from the indexer. Returns null if unreachable. */
export async function getStats(): Promise<Stats | null> {
  try {
    const res = await fetch(`${indexer()}/api/stats`);
    if (!res.ok) return null;
    return (await res.json()) as Stats;
  } catch {
    return null;
  }
}

export async function indexerHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${indexer()}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}
