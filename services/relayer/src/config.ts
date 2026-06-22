import { resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";

/** Repo root, resolved relative to this file (services/relayer/src -> ../../..). */
export const REPO_ROOT = resolve(import.meta.dirname, "..", "..", "..");

export interface Pool {
  contractId: string;
  /** Denomination in stroops. */
  denom: number;
  /** Pool scope string used to derive coin labels. */
  scope: string;
}

export interface Manifest {
  network: string;
  token: string;
  admin: string;
  adminIdentity: string;
  pools: Pool[];
}

export interface RelayerConfig {
  port: number;
  network: string;
  /** stellar CLI identity used to sign admin (set_association_root) calls. */
  adminIdentity: string;
  manifest: Manifest;
  /** Absolute paths to the tools the prover shells out to. */
  paths: {
    coinutils: string;
    circom2soroban: string;
    circuitWasm: string;
    generateWitness: string;
    zkey: string;
    work: string;
  };
}

function firstExisting(...candidates: string[]): string {
  for (const c of candidates) if (existsSync(c)) return c;
  return candidates[0];
}

export function loadConfig(): RelayerConfig {
  const network = process.env.VEIL_NETWORK ?? "testnet";
  const manifestPath =
    process.env.VEIL_MANIFEST ?? resolve(REPO_ROOT, "deployments", `${network}.json`);

  if (!existsSync(manifestPath)) {
    throw new Error(
      `Deployment manifest not found at ${manifestPath}. Run scripts/deploy-pools.sh ${network} first.`,
    );
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;

  const coinutils = firstExisting(
    resolve(REPO_ROOT, "target/release/stellar-coinutils"),
    resolve(REPO_ROOT, "target/debug/stellar-coinutils"),
  );
  const circom2soroban = firstExisting(
    resolve(REPO_ROOT, "target/release/stellar-circom2soroban"),
    resolve(REPO_ROOT, "target/debug/stellar-circom2soroban"),
  );

  return {
    port: Number(process.env.PORT ?? 8787),
    network,
    adminIdentity: process.env.VEIL_ADMIN_IDENTITY ?? manifest.adminIdentity,
    manifest,
    paths: {
      coinutils,
      circom2soroban,
      circuitWasm: resolve(REPO_ROOT, "circuits/build/main_js/main.wasm"),
      generateWitness: resolve(REPO_ROOT, "circuits/build/main_js/generate_witness.js"),
      zkey: resolve(REPO_ROOT, "circuits/output/main_final.zkey"),
      work: resolve(REPO_ROOT, "deployments/.work"),
    },
  };
}
