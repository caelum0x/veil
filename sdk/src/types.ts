// Core SDK types + lightweight type guards.

export type Network = "testnet" | "futurenet" | "mainnet";

export interface Pool {
  contractId: string;
  denom: number;
  scope: string;
}

export interface PoolsResponse {
  network: string;
  token: string;
  pools: Pool[];
}

export interface CoinData {
  value: string;
  nullifier: string;
  secret: string;
  label: string;
  commitment: string;
}

export interface Note {
  coin: CoinData;
  commitment_hex: string;
}

export interface MintResult {
  note: Note;
  commitmentHex: string;
  denom: number;
  contractId: string;
  scope: string;
}

export interface ConfirmResult {
  leafCount: number;
  associationRoot: string;
}

export interface WithdrawalProof {
  proofHex: string;
  publicHex: string;
  contractId: string;
  denom: number;
  recipient?: string;
}

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

export interface IndexerStats {
  pools: PoolSnapshot[];
  totalCommitments: number;
  totalWithdrawals: number;
  totalLocked: string;
}

export function isNote(v: unknown): v is Note {
  const n = v as Note;
  return !!n && typeof n === "object" && !!n.coin && typeof n.commitment_hex === "string";
}

export function isPool(v: unknown): v is Pool {
  const p = v as Pool;
  return !!p && typeof p.contractId === "string" && typeof p.denom === "number";
}

export function isPoolSnapshot(v: unknown): v is PoolSnapshot {
  const s = v as PoolSnapshot;
  return !!s && typeof s.commitmentCount === "number" && typeof s.denom === "number";
}

export function isCoinData(v: unknown): v is CoinData {
  const c = v as CoinData;
  return !!c && typeof c.commitment === "string" && typeof c.nullifier === "string";
}
