// Stellar key format helpers + explorer URLs.

import type { Network } from "./types.ts";

export function isAccount(s: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(s);
}
export function isContractId(s: string): boolean {
  return /^C[A-Z2-7]{55}$/.test(s);
}
export function isMuxed(s: string): boolean {
  return /^M[A-Z2-7]{68}$/.test(s);
}
export function isSecret(s: string): boolean {
  return /^S[A-Z2-7]{55}$/.test(s);
}
export function looksLikeKey(s: string): boolean {
  return isAccount(s) || isContractId(s) || isMuxed(s);
}
export function shorten(s: string, head = 6, tail = 6): string {
  if (!s || s.length <= head + tail + 1) return s ?? "";
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}
export function normalize(s: string): string {
  return s.trim().toUpperCase();
}
export function equalKeys(a: string, b: string): boolean {
  return normalize(a) === normalize(b);
}
export function accountUrl(addr: string, network: Network = "testnet"): string {
  return `https://stellar.expert/explorer/${network}/account/${addr}`;
}
export function contractUrl(cid: string, network: Network = "testnet"): string {
  return `https://stellar.expert/explorer/${network}/contract/${cid}`;
}
export function txUrl(hash: string, network: Network = "testnet"): string {
  return `https://stellar.expert/explorer/${network}/tx/${hash}`;
}
export function maskSecret(s: string): string {
  return isSecret(s) ? `${s.slice(0, 2)}${"•".repeat(10)}` : s;
}
