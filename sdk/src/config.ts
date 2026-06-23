import type { Network } from "./types.ts";

export interface VeilConfig {
  network: Network;
  relayerUrl: string;
  indexerUrl: string;
  rpcUrl: string;
  networkPassphrase: string;
}

const RPC_URLS: Record<Network, string> = {
  testnet: "https://soroban-testnet.stellar.org",
  futurenet: "https://rpc-futurenet.stellar.org",
  mainnet: "https://mainnet.sorobanrpc.com",
};

const PASSPHRASES: Record<Network, string> = {
  testnet: "Test SDF Network ; September 2015",
  futurenet: "Test SDF Future Network ; October 2022",
  mainnet: "Public Global Stellar Network ; September 2015",
};

export function rpcUrl(network: Network): string {
  return RPC_URLS[network];
}

export function passphrase(network: Network): string {
  return PASSPHRASES[network];
}

export function isNetwork(s: string): s is Network {
  return s === "testnet" || s === "futurenet" || s === "mainnet";
}

export function defaultConfig(network: Network = "testnet"): VeilConfig {
  return {
    network,
    relayerUrl: "http://localhost:8787",
    indexerUrl: "http://localhost:8789",
    rpcUrl: rpcUrl(network),
    networkPassphrase: passphrase(network),
  };
}

export function withConfig(base: VeilConfig, overrides: Partial<VeilConfig>): VeilConfig {
  return { ...base, ...overrides };
}

export function validateConfig(cfg: VeilConfig): string[] {
  const errs: string[] = [];
  if (!isNetwork(cfg.network)) errs.push(`invalid network: ${cfg.network}`);
  if (!/^https?:\/\//.test(cfg.relayerUrl)) errs.push("relayerUrl must be http(s)");
  if (!/^https?:\/\//.test(cfg.indexerUrl)) errs.push("indexerUrl must be http(s)");
  return errs;
}

export function explorerBase(network: Network): string {
  return `https://stellar.expert/explorer/${network}`;
}
