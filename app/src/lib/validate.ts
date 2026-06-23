// Form/input validation helpers for the dapp.

import { isAccount } from "./strkey.ts";
import { isHex32 } from "./hex.ts";

export function nonEmpty(s: string): boolean {
  return s.trim().length > 0;
}

export function isValidRecipient(s: string): boolean {
  return isAccount(s.trim());
}

export function isValidCommitment(s: string): boolean {
  return isHex32(s);
}

export function isJson(s: string): boolean {
  try {
    JSON.parse(s);
    return true;
  } catch {
    return false;
  }
}

export function isPositiveNumber(s: string): boolean {
  const n = Number(s);
  return Number.isFinite(n) && n > 0;
}

export function inRange(n: number, lo: number, hi: number): boolean {
  return n >= lo && n <= hi;
}

export interface FieldError {
  field: string;
  message: string;
}

export function validateWithdraw(noteText: string, recipient: string): FieldError[] {
  const errs: FieldError[] = [];
  if (!nonEmpty(noteText)) errs.push({ field: "note", message: "Note is required" });
  else if (!isJson(noteText)) errs.push({ field: "note", message: "Note must be valid JSON" });
  if (!isValidRecipient(recipient))
    errs.push({ field: "recipient", message: "Enter a valid G… address" });
  return errs;
}

export function firstError(errs: FieldError[]): string | null {
  return errs.length ? errs[0].message : null;
}

export function isClean(errs: FieldError[]): boolean {
  return errs.length === 0;
}
