// VeilClient — high-level facade over the relayer + indexer.
//
// The SDK does NOT sign or submit Stellar transactions (that needs a wallet/keypair
// the caller controls). Instead it prepares everything: deposit returns a note +
// commitment for the caller to submit `deposit(from, commitment)`, and withdrawal
// returns a verified proof for the caller to submit `withdraw(to, proof, signals)`.

import type {
  Pool,
  PoolsResponse,
  Note,
  MintResult,
  ConfirmResult,
  WithdrawalProof,
  IndexerStats,
  PoolSnapshot,
  Network,
} from "./types.ts";
import { type VeilConfig, defaultConfig, explorerBase } from "./config.ts";
import { RelayerClient } from "./relayerClient.ts";
import { IndexerClient } from "./indexerClient.ts";
import { requirePool, byDenom, sortByDenom } from "./pools.ts";
import { isValid as isValidNote } from "./notes.ts";
import { ValidationError } from "./errors.ts";

export class VeilClient {
  readonly config: VeilConfig;
  readonly relayer: RelayerClient;
  readonly indexer: IndexerClient;
  private poolCache?: Pool[];

  constructor(config?: Partial<VeilConfig> & { network?: Network }) {
    this.config = { ...defaultConfig(config?.network ?? "testnet"), ...config };
    this.relayer = new RelayerClient(this.config.relayerUrl);
    this.indexer = new IndexerClient(this.config.indexerUrl);
  }

  /** Fetch (and cache) the pool list from the relayer. */
  async getPools(force = false): Promise<Pool[]> {
    if (!force && this.poolCache) return this.poolCache;
    const res: PoolsResponse = await this.relayer.pools();
    this.poolCache = sortByDenom(res.pools);
    return this.poolCache;
  }

  async getPool(denom: number): Promise<Pool> {
    return requirePool(await this.getPools(), denom);
  }

  async hasPool(denom: number): Promise<boolean> {
    return !!byDenom(await this.getPools(), denom);
  }

  /** Step 1 of a deposit: mint a coin note + commitment to submit on-chain. */
  async prepareDeposit(denom: number): Promise<MintResult> {
    return this.relayer.mintNote(denom);
  }

  /** Step 2 of a deposit: after the on-chain deposit confirms, register it. */
  async finalizeDeposit(denom: number, note: Note): Promise<ConfirmResult> {
    if (!isValidNote(note)) throw new ValidationError("invalid note", "note");
    return this.relayer.confirmDeposit(denom, note);
  }

  /** Prepare a withdrawal: returns a proof to submit as `withdraw(...)`. */
  async prepareWithdrawal(denom: number, note: Note, recipient: string): Promise<WithdrawalProof> {
    if (!isValidNote(note)) throw new ValidationError("invalid note", "note");
    return this.relayer.requestWithdrawalProof(denom, note, recipient);
  }

  async getStats(): Promise<IndexerStats> {
    return this.indexer.stats();
  }

  async poolStatus(denom: number): Promise<PoolSnapshot> {
    return this.indexer.pool(denom);
  }

  async anonymitySet(denom: number): Promise<number> {
    return this.indexer.anonymitySet(denom);
  }

  async health(): Promise<{ relayer: boolean; indexer: boolean }> {
    const [relayer, indexer] = await Promise.all([this.relayer.isUp(), this.indexer.isUp()]);
    return { relayer, indexer };
  }

  explorerUrl(): string {
    return explorerBase(this.config.network);
  }

  txUrl(hash: string): string {
    return `${this.explorerUrl()}/tx/${hash}`;
  }

  contractUrl(contractId: string): string {
    return `${this.explorerUrl()}/contract/${contractId}`;
  }
}

export function createClient(config?: Partial<VeilConfig> & { network?: Network }): VeilClient {
  return new VeilClient(config);
}
