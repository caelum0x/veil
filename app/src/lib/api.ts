import { getSettings } from "./settings.ts";
import {
  demoEnabled,
  demoPools,
  demoMintNote,
  demoStats,
  demoDelay,
  randomHex,
} from "./demo.ts";

export interface Pool {
  contractId: string;
  denom: number;
  scope: string;
}

/** Opaque coin note the user must keep secret to withdraw later. */
export type Note = unknown;

function relayer(): string {
  return getSettings().relayerUrl;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${relayer()}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? `request failed: ${res.status}`);
  return json as T;
}

export async function getPools(): Promise<{ network: string; token: string; pools: Pool[] }> {
  if (demoEnabled()) {
    const pools = demoPools().map((p) => ({ contractId: p.contractId, denom: p.denom, scope: p.scope }));
    return { network: getSettings().network, token: "native (XLM)", pools };
  }
  const res = await fetch(`${relayer()}/api/pools`);
  if (!res.ok) throw new Error(`could not load pools: ${res.status}`);
  return res.json();
}

export async function relayerHealth(): Promise<{ ok: boolean; network: string; pools: number }> {
  if (demoEnabled()) return { ok: true, network: getSettings().network, pools: demoPools().length };
  const res = await fetch(`${relayer()}/api/health`);
  if (!res.ok) throw new Error(`relayer unreachable: ${res.status}`);
  return res.json();
}

export function mintNote(denom: number) {
  if (demoEnabled()) return demoDelay(demoMintNote(denom), 600);
  return post<{ note: Note; commitmentHex: string; denom: number; contractId: string; scope: string }>(
    "/api/notes",
    { denom },
  );
}

export function confirmDeposit(denom: number, _note: Note) {
  if (demoEnabled()) {
    void _note;
    return demoDelay({ leafCount: demoStats().totalCommitments, associationRoot: randomHex(32) }, 500);
  }
  return post<{ leafCount: number; associationRoot: string }>("/api/deposits/confirm", { denom, note: _note });
}

export function requestWithdrawalProof(denom: number, note: Note, recipient: string) {
  if (demoEnabled()) {
    void recipient;
    const pool = demoPools().find((p) => p.denom === denom) ?? demoPools()[0];
    // A Groth16 proof is 3 G1/G2 points (~256 bytes); public signals a handful of field elements.
    return demoDelay(
      { proofHex: randomHex(256), publicHex: randomHex(160), contractId: pool.contractId, denom },
      1400,
    );
  }
  return post<{ proofHex: string; publicHex: string; contractId: string; denom: number }>(
    "/api/withdraw",
    { denom, note, recipient },
  );
}
