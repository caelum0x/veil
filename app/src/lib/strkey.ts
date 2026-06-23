// Stellar address / contract-id string helpers (format-level, not cryptographic).

export function isAccount(s: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(s);
}

export function isContractId(s: string): boolean {
  return /^C[A-Z2-7]{55}$/.test(s);
}

export function isMuxedAccount(s: string): boolean {
  return /^M[A-Z2-7]{68}$/.test(s);
}

export function isSecretSeed(s: string): boolean {
  return /^S[A-Z2-7]{55}$/.test(s);
}

export function looksLikeKey(s: string): boolean {
  return isAccount(s) || isContractId(s) || isMuxedAccount(s);
}

export function shorten(s: string, head = 6, tail = 6): string {
  if (!s || s.length <= head + tail + 1) return s ?? "";
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

export function keyKind(s: string): "account" | "contract" | "muxed" | "secret" | "unknown" {
  if (isAccount(s)) return "account";
  if (isContractId(s)) return "contract";
  if (isMuxedAccount(s)) return "muxed";
  if (isSecretSeed(s)) return "secret";
  return "unknown";
}

export function explorerAccountUrl(addr: string, network = "testnet"): string {
  return `https://stellar.expert/explorer/${network}/account/${addr}`;
}

export function explorerContractUrl(cid: string, network = "testnet"): string {
  return `https://stellar.expert/explorer/${network}/contract/${cid}`;
}

export function explorerTxUrl(hash: string, network = "testnet"): string {
  return `https://stellar.expert/explorer/${network}/tx/${hash}`;
}

export function normalize(s: string): string {
  return s.trim().toUpperCase();
}

export function equalKeys(a: string, b: string): boolean {
  return normalize(a) === normalize(b);
}

export function maskSecret(s: string): string {
  return isSecretSeed(s) ? `${s.slice(0, 2)}${"•".repeat(10)}` : s;
}
