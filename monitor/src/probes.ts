// Probes — each checks one dependency and returns a timed, structured result.

import { RelayerClient } from "../../sdk/src/relayerClient.ts";
import { IndexerClient } from "../../sdk/src/indexerClient.ts";
import type { IndexerStats, PoolsResponse } from "../../sdk/src/types.ts";
import type { MonitorConfig } from "./config.ts";

export type ProbeStatus = "up" | "degraded" | "down";

export interface ProbeResult {
  name: string;
  status: ProbeStatus;
  latencyMs: number;
  detail?: string;
  at: number;
}

async function timed<T>(name: string, fn: () => Promise<T>): Promise<{ value: T | null; result: ProbeResult }> {
  const start = Date.now();
  try {
    const value = await fn();
    return { value, result: { name, status: "up", latencyMs: Date.now() - start, at: Date.now() } };
  } catch (e) {
    return {
      value: null,
      result: {
        name,
        status: "down",
        latencyMs: Date.now() - start,
        detail: e instanceof Error ? e.message : String(e),
        at: Date.now(),
      },
    };
  }
}

export class Probes {
  private relayer: RelayerClient;
  private indexer: IndexerClient;

  constructor(cfg: MonitorConfig) {
    this.relayer = new RelayerClient(cfg.relayerUrl);
    this.indexer = new IndexerClient(cfg.indexerUrl);
  }

  async relayerHealth(): Promise<ProbeResult> {
    return (await timed("relayer", () => this.relayer.health())).result;
  }

  async indexerHealth(): Promise<ProbeResult> {
    return (await timed("indexer", () => this.indexer.health())).result;
  }

  async pools(): Promise<{ result: ProbeResult; data: PoolsResponse | null }> {
    const { value, result } = await timed("pools", () => this.relayer.pools());
    return { result, data: value };
  }

  async stats(): Promise<{ result: ProbeResult; data: IndexerStats | null }> {
    const { value, result } = await timed("stats", () => this.indexer.stats());
    // A pool reporting an error from the chain degrades (not downs) the probe.
    if (value && value.pools.some((p) => p.error)) {
      result.status = "degraded";
      result.detail = `${value.pools.filter((p) => p.error).length} pool(s) unreachable on-chain`;
    }
    return { result, data: value };
  }

  async all(): Promise<{ probes: ProbeResult[]; stats: IndexerStats | null }> {
    const [relayer, indexer, statsRes] = await Promise.all([
      this.relayerHealth(),
      this.indexerHealth(),
      this.stats(),
    ]);
    return { probes: [relayer, indexer, statsRes.result], stats: statsRes.data };
  }
}
