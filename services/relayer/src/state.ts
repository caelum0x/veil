import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Per-pool off-chain state the coordinator must mirror so generated proofs match
 * on-chain roots: the ordered list of commitment field-elements (decimal strings,
 * in on-chain insertion order) and the path to the pool's association-set file.
 *
 * This is intentionally simple file-backed JSON — the coordinator is the single
 * writer. A production deployment would back this with a database and reconstruct
 * from chain events on restart.
 */
export interface PoolState {
  /** Commitment field elements (decimal), in the order they were deposited. */
  commitments: string[];
}

interface StateFile {
  network: string;
  pools: Record<string, PoolState>; // keyed by scope
}

export class StateStore {
  private file: string;
  private workDir: string;
  private data: StateFile;

  constructor(network: string, workDir: string) {
    this.workDir = workDir;
    mkdirSync(workDir, { recursive: true });
    this.file = resolve(workDir, `state-${network}.json`);
    this.data = existsSync(this.file)
      ? (JSON.parse(readFileSync(this.file, "utf8")) as StateFile)
      : { network, pools: {} };
  }

  private persist(): void {
    writeFileSync(this.file, JSON.stringify(this.data, null, 2));
  }

  pool(scope: string): PoolState {
    if (!this.data.pools[scope]) this.data.pools[scope] = { commitments: [] };
    return this.data.pools[scope];
  }

  addCommitment(scope: string, commitmentDecimal: string): number {
    const p = this.pool(scope);
    p.commitments.push(commitmentDecimal);
    this.persist();
    return p.commitments.length;
  }

  /** Path to the association-set file for a pool (managed by coinutils). */
  associationFile(scope: string): string {
    return resolve(this.workDir, `assoc-${scope}.json`);
  }

  /** Writes a snarkjs-compatible state file and returns its path. */
  writeStateFile(scope: string): string {
    const p = this.pool(scope);
    const path = resolve(this.workDir, `state-${scope}.json`);
    writeFileSync(path, JSON.stringify({ commitments: p.commitments, scope }, null, 2));
    return path;
  }
}
