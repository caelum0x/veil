// Direct, read-only contract access from the browser via Soroban RPC simulation.
// No wallet, no relayer — the dapp reads on-chain pool state itself.

import { Buffer } from "buffer";
import {
  rpc,
  TransactionBuilder,
  BASE_FEE,
  Contract,
  Account,
  Networks,
  scValToNative,
} from "@stellar/stellar-sdk";
import { getSettings } from "./settings.ts";

// A valid, funded testnet account used only as the simulation source (never signs,
// never pays). Read-only `simulateTransaction` does not touch its balance.
const READ_SOURCE = "GBWNJFSGF2MLGY5NSY4ICHJHVBG4MWKYRMS7WCPCWVNQSLJ3CZLKC473";

function passphrase(network: string): string {
  if (network === "mainnet") return Networks.PUBLIC;
  if (network === "futurenet") return Networks.FUTURENET;
  return Networks.TESTNET;
}

function toHex(v: unknown): string {
  if (v instanceof Uint8Array) return Buffer.from(v).toString("hex");
  return typeof v === "string" ? v : String(v ?? "");
}

async function read(contractId: string, method: string): Promise<unknown> {
  const s = getSettings();
  const server = new rpc.Server(s.rpcUrl);
  const source = new Account(READ_SOURCE, "0");
  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: passphrase(s.network),
  })
    .addOperation(new Contract(contractId).call(method))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) throw new Error(`${method}: ${sim.error}`);
  if (!("result" in sim) || !sim.result) throw new Error(`${method}: no result`);
  return scValToNative(sim.result.retval);
}

export async function getDenom(cid: string): Promise<bigint> {
  return BigInt((await read(cid, "get_denom")) as bigint);
}
export async function getMerkleRoot(cid: string): Promise<string> {
  return toHex(await read(cid, "get_merkle_root"));
}
export async function getCommitmentCount(cid: string): Promise<number> {
  return Number((await read(cid, "get_commitment_count")) as number | bigint);
}
export async function getBalance(cid: string): Promise<bigint> {
  return BigInt((await read(cid, "get_balance")) as bigint);
}
export async function getNullifiers(cid: string): Promise<string[]> {
  const v = await read(cid, "get_nullifiers");
  return Array.isArray(v) ? v.map(toHex) : [];
}
export async function getRootHistory(cid: string): Promise<string[]> {
  const v = await read(cid, "get_root_history");
  return Array.isArray(v) ? v.map(toHex) : [];
}
export async function getAdmin(cid: string): Promise<string> {
  return String(await read(cid, "get_admin"));
}
export async function getAssociationRoot(cid: string): Promise<string> {
  return toHex(await read(cid, "get_association_root"));
}
export async function hasAssociationSet(cid: string): Promise<boolean> {
  return Boolean(await read(cid, "has_association_set"));
}

export interface PoolOnChain {
  denom: bigint;
  merkleRoot: string;
  commitmentCount: number;
  balance: bigint;
  nullifierCount: number;
  rootHistory: string[];
  admin: string;
  associationRoot: string;
  hasAssociation: boolean;
}

/** Read a full on-chain snapshot of one pool directly from the contract. */
export async function readPool(contractId: string): Promise<PoolOnChain> {
  const [denom, merkleRoot, commitmentCount, balance, nullifiers, rootHistory, admin, associationRoot, hasAssociation] =
    await Promise.all([
      getDenom(contractId),
      getMerkleRoot(contractId),
      getCommitmentCount(contractId),
      getBalance(contractId),
      getNullifiers(contractId),
      getRootHistory(contractId),
      getAdmin(contractId),
      getAssociationRoot(contractId),
      hasAssociationSet(contractId),
    ]);
  return {
    denom,
    merkleRoot,
    commitmentCount,
    balance,
    nullifierCount: nullifiers.length,
    rootHistory,
    admin,
    associationRoot,
    hasAssociation,
  };
}
