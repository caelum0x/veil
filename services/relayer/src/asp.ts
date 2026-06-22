import { readFileSync, existsSync } from "node:fs";
import { run } from "./exec.js";
import type { RelayerConfig } from "./config.js";

/**
 * Association Set Provider coordination.
 *
 * The coordinator holds the admin key for every pool. After a deposit it adds the
 * coin's label to that pool's association set (via the coinutils Merkle builder),
 * then publishes the new association root on-chain with `set_association_root`.
 * Withdrawal proofs prove membership in this set, which is how the pool offers
 * privacy *with* a compliance hook rather than unconditional anonymity.
 */
export class Asp {
  constructor(private cfg: RelayerConfig) {}

  /** Adds a label to a pool's association set; returns the new root (decimal). */
  async addLabel(labelDecimal: string, assocFile: string): Promise<string> {
    await run(this.cfg.paths.coinutils, ["update-association", assocFile, labelDecimal]);
    if (!existsSync(assocFile)) throw new Error(`association file not written: ${assocFile}`);
    const assoc = JSON.parse(readFileSync(assocFile, "utf8")) as { root?: string };
    if (!assoc.root) throw new Error("association set has no root after update");
    return assoc.root;
  }

  /** Publishes the association root on-chain for a pool (admin-signed). */
  async setRootOnChain(contractId: string, rootDecimal: string): Promise<void> {
    const rootHex = BigInt(rootDecimal).toString(16).padStart(64, "0");
    await run("stellar", [
      "contract",
      "invoke",
      "--id",
      contractId,
      "--source",
      this.cfg.adminIdentity,
      "--network",
      this.cfg.network,
      "--",
      "set_association_root",
      "--caller",
      this.cfg.adminIdentity,
      "--association_root",
      rootHex,
    ]);
  }
}
