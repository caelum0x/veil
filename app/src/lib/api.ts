const RELAYER_URL = import.meta.env.VITE_RELAYER_URL ?? "http://localhost:8787";

export interface Pool {
  contractId: string;
  denom: number;
  scope: string;
}

/** Opaque coin note the user must keep secret to withdraw later. */
export type Note = unknown;

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${RELAYER_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? `request failed: ${res.status}`);
  return json as T;
}

export async function getPools(): Promise<{ network: string; token: string; pools: Pool[] }> {
  const res = await fetch(`${RELAYER_URL}/api/pools`);
  if (!res.ok) throw new Error(`could not load pools: ${res.status}`);
  return res.json();
}

export function mintNote(denom: number) {
  return post<{ note: Note; commitmentHex: string; denom: number; contractId: string; scope: string }>(
    "/api/notes",
    { denom },
  );
}

export function confirmDeposit(denom: number, note: Note) {
  return post<{ leafCount: number; associationRoot: string }>("/api/deposits/confirm", { denom, note });
}

export function requestWithdrawalProof(denom: number, note: Note, recipient: string) {
  return post<{ proofHex: string; publicHex: string; contractId: string; denom: number }>(
    "/api/withdraw",
    { denom, note, recipient },
  );
}
