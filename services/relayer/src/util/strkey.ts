// Stellar key format helpers.

export function isAccount(s: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(s);
}
export function isContractId(s: string): boolean {
  return /^C[A-Z2-7]{55}$/.test(s);
}
export function isSecretSeed(s: string): boolean {
  return /^S[A-Z2-7]{55}$/.test(s);
}
export function looksLikeKey(s: string): boolean {
  return isAccount(s) || isContractId(s);
}
export function shorten(s: string, head = 6, tail = 6): string {
  if (!s || s.length <= head + tail + 1) return s ?? "";
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}
export function normalize(s: string): string {
  return s.trim().toUpperCase();
}
export function requireAccount(s: string): string {
  if (!isAccount(s.trim())) throw new Error(`invalid Stellar account: ${s}`);
  return s.trim();
}
export function requireContractId(s: string): string {
  if (!isContractId(s.trim())) throw new Error(`invalid contract id: ${s}`);
  return s.trim();
}
