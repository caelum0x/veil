// Request validation helpers for the relayer API.

import { isAccount } from "./strkey.js";
import { isHex32 } from "./hex.js";

export function nonEmpty(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0;
}
export function isNumberLike(v: unknown): boolean {
  return typeof v === "number" || (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)));
}
export function isPositiveAmount(v: unknown): boolean {
  return isNumberLike(v) && Number(v) > 0;
}
export function isRecipient(v: unknown): v is string {
  return typeof v === "string" && isAccount(v.trim());
}
export function isCommitmentHex(v: unknown): v is string {
  return typeof v === "string" && isHex32(v);
}
export function hasKeys(obj: unknown, keys: string[]): boolean {
  return typeof obj === "object" && obj !== null && keys.every((k) => k in (obj as Record<string, unknown>));
}
export function requireField<T>(obj: Record<string, unknown>, key: string): T {
  if (!(key in obj)) throw new Error(`missing field: ${key}`);
  return obj[key] as T;
}
export function isNote(v: unknown): boolean {
  return (
    typeof v === "object" &&
    v !== null &&
    "coin" in (v as Record<string, unknown>) &&
    "commitment_hex" in (v as Record<string, unknown>)
  );
}
export function clampInt(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(Math.trunc(v), lo), hi);
}
export function sanitizeScope(s: string): string {
  return s.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 64);
}
