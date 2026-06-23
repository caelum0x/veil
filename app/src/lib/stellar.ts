import {
  rpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Contract,
  Address,
  xdr,
  scValToNative,
} from "@stellar/stellar-sdk";
import {
  isConnected,
  requestAccess,
  getAddress,
  signTransaction,
} from "@stellar/freighter-api";
import { Buffer } from "buffer";
import { getSettings } from "./settings.ts";

function networkPassphrase(): string {
  const net = getSettings().network;
  if (net === "mainnet") return Networks.PUBLIC;
  if (net === "futurenet") return Networks.FUTURENET;
  return Networks.TESTNET;
}

/** RPC server for the currently-configured network. */
export function getServer(): rpc.Server {
  return new rpc.Server(getSettings().rpcUrl);
}

/** Connects Freighter and returns the user's public key. */
export async function connectWallet(): Promise<string> {
  const conn = await isConnected();
  if (!conn.isConnected) throw new Error("Freighter not detected. Install the Freighter extension.");
  const access = await requestAccess();
  if (access.error) throw new Error(access.error);
  return access.address;
}

export async function currentAddress(): Promise<string | null> {
  try {
    const res = await getAddress();
    return res.error ? null : res.address || null;
  } catch {
    return null;
  }
}

/** Converts a hex string (optionally 0x-prefixed) into an ScVal bytes value. */
export function hexToScValBytes(hex: string): xdr.ScVal {
  const clean = hex.replace(/^0x/i, "");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return xdr.ScVal.scvBytes(Buffer.from(bytes));
}

export function addressScVal(pubkey: string): xdr.ScVal {
  return Address.fromString(pubkey).toScVal();
}

export interface InvokeResult {
  hash: string;
  returnValue: unknown;
}

/**
 * Builds, simulates, signs (via Freighter) and submits a Soroban contract call.
 * The `signer` account is both the auth source and the fee payer.
 */
export async function invoke(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  signer: string,
): Promise<InvokeResult> {
  const server = getServer();
  const NETWORK_PASSPHRASE = networkPassphrase();
  const account = await server.getAccount(signer);
  const op = new Contract(contractId).call(method, ...args);
  const built = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(60)
    .build();

  const prepared = await server.prepareTransaction(built);

  const signed = await signTransaction(prepared.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
    address: signer,
  });
  if (signed.error) throw new Error(String(signed.error));

  const signedTx = TransactionBuilder.fromXDR(signed.signedTxXdr, NETWORK_PASSPHRASE);
  const sent = await server.sendTransaction(signedTx);
  if (sent.status === "ERROR") throw new Error(`submit failed: ${JSON.stringify(sent.errorResult)}`);

  // Poll for completion.
  let got = await server.getTransaction(sent.hash);
  for (let i = 0; i < 30 && got.status === rpc.Api.GetTransactionStatus.NOT_FOUND; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    got = await server.getTransaction(sent.hash);
  }
  if (got.status !== rpc.Api.GetTransactionStatus.SUCCESS)
    throw new Error(`transaction ${sent.hash} did not succeed: ${got.status}`);

  let returnValue: unknown = null;
  try {
    if (got.returnValue) returnValue = scValToNative(got.returnValue);
  } catch {
    /* ignore decode errors */
  }
  return { hash: sent.hash, returnValue };
}

/** deposit(from, commitment) — depositor signs and pays the pool's denomination. */
export function deposit(contractId: string, from: string, commitmentHex: string) {
  return invoke(contractId, "deposit", [addressScVal(from), hexToScValBytes(commitmentHex)], from);
}

/** withdraw(to, proof_bytes, pub_signals_bytes) — recipient signs and receives funds. */
export function withdraw(
  contractId: string,
  to: string,
  proofHex: string,
  publicHex: string,
) {
  return invoke(
    contractId,
    "withdraw",
    [addressScVal(to), hexToScValBytes(proofHex), hexToScValBytes(publicHex)],
    to,
  );
}
