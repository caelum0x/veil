// Chain reader — wraps the SDK indexer/relayer clients and derives keeper metrics.

import { IndexerClient } from "../../sdk/src/indexerClient.ts";
import { RelayerClient } from "../../sdk/src/relayerClient.ts";
import type { PoolSnapshot, IndexerStats, Pool } from "../../sdk/src/types.ts";
import type { KeeperConfig } from "./config.ts";

const TREE_DEPTH = 20;

export class Chain {
  readonly indexer: IndexerClient;
  readonly relayer: RelayerClient;

  constructor(cfg: KeeperConfig) {
    this.indexer = new IndexerClient(cfg.indexerUrl);
    this.relayer = new RelayerClient(cfg.relayerUrl);
  }

  async pools(): Promise<Pool[]> {
    return (await this.relayer.pools()).pools;
  }

  async stats(): Promise<IndexerStats> {
    return this.indexer.stats();
  }

  async snapshots(): Promise<PoolSnapshot[]> {
    return (await this.indexer.stats()).pools;
  }

  /** Fill level of a pool in basis points (0..10000). */
  fillBps(snap: PoolSnapshot): number {
    const cap = 2 ** TREE_DEPTH;
    return Math.floor((snap.commitmentCount / cap) * 10_000);
  }

  /** Whether a pool's latest snapshot is older than `staleMs`. */
  isStale(snap: PoolSnapshot, staleMs: number): boolean {
    return Date.now() - snap.lastUpdated > staleMs;
  }

  /** Pools whose fill exceeds the warn threshold. */
  async overFilled(warnBps: number): Promise<PoolSnapshot[]> {
    return (await this.snapshots()).filter((s) => this.fillBps(s) >= warnBps);
  }

  /** Pools currently reporting an error from the indexer. */
  async unhealthy(): Promise<PoolSnapshot[]> {
    return (await this.snapshots()).filter((s) => !!s.error);
  }

  async totalLocked(): Promise<bigint> {
    return BigInt((await this.stats()).totalLocked || "0");
  }

  async reachable(): Promise<{ relayer: boolean; indexer: boolean }> {
    const [relayer, indexer] = await Promise.all([this.relayer.isUp(), this.indexer.isUp()]);
    return { relayer, indexer };
  }
}
