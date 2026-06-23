import { resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";

export const REPO_ROOT = resolve(import.meta.dirname, "..", "..", "..");

export interface Pool {
  contractId: string;
  denom: number;
  scope: string;
}

export interface Manifest {
  network: string;
  token: string;
  admin: string;
  adminIdentity: string;
  pools: Pool[];
}

export interface IndexerConfig {
  port: number;
  rpcUrl: string;
  networkPassphrase: string;
  /** A valid-format account key used only as the simulation source (never signs). */
  simSource: string;
  pollIntervalMs: number;
  manifest: Manifest;
}

const PASSPHRASES: Record<string, string> = {
  testnet: "Test SDF Network ; September 2015",
  futurenet: "Test SDF Future Network ; October 2022",
  mainnet: "Public Global Stellar Network ; September 2015",
};

const RPC_URLS: Record<string, string> = {
  testnet: "https://soroban-testnet.stellar.org",
  futurenet: "https://rpc-futurenet.stellar.org",
  mainnet: "https://mainnet.sorobanrpc.com",
};

export function loadConfig(): IndexerConfig {
  const network = process.env.VEIL_NETWORK ?? "testnet";
  const manifestPath =
    process.env.VEIL_MANIFEST ?? resolve(REPO_ROOT, "deployments", `${network}.json`);
  if (!existsSync(manifestPath))
    throw new Error(`Deployment manifest not found at ${manifestPath}. Deploy pools first.`);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;

  return {
    port: Number(process.env.PORT ?? 8789),
    rpcUrl: process.env.VEIL_RPC_URL ?? RPC_URLS[network] ?? RPC_URLS.testnet,
    networkPassphrase: PASSPHRASES[network] ?? PASSPHRASES.testnet,
    simSource: process.env.VEIL_SIM_SOURCE ?? manifest.admin,
    pollIntervalMs: Number(process.env.VEIL_POLL_MS ?? 15000),
    manifest,
  };
}
