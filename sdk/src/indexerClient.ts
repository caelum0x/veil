// Typed client for the Veil indexer API.

import type { IndexerStats, PoolSnapshot } from "./types.ts";
import { getJson, type HttpOptions } from "./http.ts";

export class IndexerClient {
  constructor(
    private baseUrl: string,
    private http: HttpOptions = {},
  ) {}

  url(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  async health(): Promise<{ ok: boolean; network: string; pools: number }> {
    return getJson(this.url("/api/health"), this.http);
  }

  async stats(): Promise<IndexerStats> {
    return getJson(this.url("/api/stats"), this.http);
  }

  async pool(denom: number): Promise<PoolSnapshot> {
    return getJson(this.url(`/api/pools/${denom}`), this.http);
  }

  async anonymitySet(denom: number): Promise<number> {
    return (await this.pool(denom)).commitmentCount;
  }

  async totalLocked(): Promise<string> {
    return (await this.stats()).totalLocked;
  }

  async isUp(): Promise<boolean> {
    try {
      await this.health();
      return true;
    } catch {
      return false;
    }
  }
}
