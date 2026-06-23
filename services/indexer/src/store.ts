export interface PoolSnapshot {
  contractId: string;
  denom: number;
  scope: string;
  /** Number of commitments deposited (anonymity-set size). */
  commitmentCount: number;
  /** Number of spent nullifiers (i.e. completed withdrawals). */
  nullifierCount: number;
  /** Current Merkle root (hex). */
  merkleRoot: string;
  /** Contract token balance in stroops. */
  balance: string;
  /** Size of the accepted root-history window. */
  rootHistorySize: number;
  lastUpdated: number;
  /** Set when the last poll for this pool failed. */
  error?: string;
}

/** In-memory snapshot of all pools, refreshed by the poller. */
export class SnapshotStore {
  private snapshots = new Map<number, PoolSnapshot>();

  set(snap: PoolSnapshot): void {
    this.snapshots.set(snap.denom, snap);
  }

  get(denom: number): PoolSnapshot | undefined {
    return this.snapshots.get(denom);
  }

  all(): PoolSnapshot[] {
    return [...this.snapshots.values()].sort((a, b) => a.denom - b.denom);
  }

  /** Aggregate stats across all pools. */
  totals(): { pools: number; totalCommitments: number; totalWithdrawals: number; totalLocked: string } {
    const snaps = this.all();
    const totalCommitments = snaps.reduce((n, s) => n + s.commitmentCount, 0);
    const totalWithdrawals = snaps.reduce((n, s) => n + s.nullifierCount, 0);
    const totalLocked = snaps.reduce((n, s) => n + BigInt(s.balance || "0"), 0n).toString();
    return { pools: snaps.length, totalCommitments, totalWithdrawals, totalLocked };
  }
}
