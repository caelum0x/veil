import type { IndexerConfig, Pool } from "./config.js";
import type { SnapshotStore } from "./store.js";
import { SorobanReader } from "./soroban.js";

function toHex(v: unknown): string {
  if (v instanceof Uint8Array) return Buffer.from(v).toString("hex");
  if (typeof v === "string") return v;
  return "";
}
function len(v: unknown): number {
  return Array.isArray(v) ? v.length : 0;
}

/**
 * Periodically reads each pool's on-chain getters and writes a fresh snapshot.
 * Purely read-only — it reconstructs the public view of each pool from the chain,
 * which is the source of truth the relayer's local state should agree with.
 */
export class Poller {
  private reader: SorobanReader;
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    private cfg: IndexerConfig,
    private store: SnapshotStore,
  ) {
    this.reader = new SorobanReader(cfg.rpcUrl, cfg.networkPassphrase, cfg.simSource);
  }

  async pollPool(pool: Pool): Promise<void> {
    try {
      const [count, nullifiers, root, balance, history] = await Promise.all([
        this.reader.call(pool.contractId, "get_commitment_count"),
        this.reader.call(pool.contractId, "get_nullifiers"),
        this.reader.call(pool.contractId, "get_merkle_root"),
        this.reader.call(pool.contractId, "get_balance"),
        this.reader.call(pool.contractId, "get_root_history").catch(() => []),
      ]);
      this.store.set({
        contractId: pool.contractId,
        denom: pool.denom,
        scope: pool.scope,
        commitmentCount: typeof count === "bigint" ? Number(count) : Number(count ?? 0),
        nullifierCount: len(nullifiers),
        merkleRoot: toHex(root),
        balance: typeof balance === "bigint" ? balance.toString() : String(balance ?? "0"),
        rootHistorySize: len(history),
        lastUpdated: Date.now(),
      });
    } catch (e) {
      const prev = this.store.get(pool.denom);
      this.store.set({
        contractId: pool.contractId,
        denom: pool.denom,
        scope: pool.scope,
        commitmentCount: prev?.commitmentCount ?? 0,
        nullifierCount: prev?.nullifierCount ?? 0,
        merkleRoot: prev?.merkleRoot ?? "",
        balance: prev?.balance ?? "0",
        rootHistorySize: prev?.rootHistorySize ?? 0,
        lastUpdated: Date.now(),
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  async pollAll(): Promise<void> {
    await Promise.all(this.cfg.manifest.pools.map((p) => this.pollPool(p)));
  }

  start(): void {
    void this.pollAll();
    this.timer = setInterval(() => void this.pollAll(), this.cfg.pollIntervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
