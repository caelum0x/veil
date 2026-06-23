// Validation helpers for circuit signals and witnesses.

import { FR_MODULUS, inField } from "./field.ts";

export function isFieldElement(v: bigint): boolean {
  return inField(v);
}
export function isReduced(v: bigint): boolean {
  return v >= 0n && v < FR_MODULUS;
}
export function fitsBits(v: bigint, bits: number): boolean {
  return v >= 0n && v < 1n << BigInt(bits);
}
export function fits128(v: bigint): boolean {
  return fitsBits(v, 128);
}
export function isNonNegative(v: bigint): boolean {
  return v >= 0n;
}
export function rangeOk(withdrawn: bigint, value: bigint): boolean {
  return withdrawn >= 0n && withdrawn <= value;
}
export function allReduced(vs: bigint[]): boolean {
  return vs.every(isReduced);
}
export function uniqueNullifiers(nullifiers: bigint[]): boolean {
  return new Set(nullifiers.map((n) => n.toString())).size === nullifiers.length;
}
export function isValidDepth(depth: number): boolean {
  return Number.isInteger(depth) && depth > 0 && depth <= 32;
}
export function publicSignalCount(numPublicInputs: number, numOutputs: number): number {
  return numPublicInputs + numOutputs;
}
export function checkSignalCount(signals: unknown[], expected: number): boolean {
  return Array.isArray(signals) && signals.length === expected;
}
export function assertField(v: bigint): bigint {
  if (!isReduced(v)) throw new Error(`value not in field: ${v}`);
  return v;
}
export function clampToField(v: bigint): bigint {
  const r = v % FR_MODULUS;
  return r >= 0n ? r : r + FR_MODULUS;
}
export function isProbablyCommitment(v: bigint): boolean {
  // commitments are pseudo-random field elements; just sanity-check the range.
  return isReduced(v) && v > 0xffffn;
}
