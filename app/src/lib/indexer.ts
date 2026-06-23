const INDEXER_URL = import.meta.env.VITE_INDEXER_URL ?? "http://localhost:8789";

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

/** Reads aggregate + per-pool stats from the indexer. Returns null if unreachable. */
export async function getStats(): Promise<Stats | null> {
  try {
    const res = await fetch(`${INDEXER_URL}/api/stats`);
    if (!res.ok) return null;
    return (await res.json()) as Stats;
  } catch {
    return null;
  }
}
