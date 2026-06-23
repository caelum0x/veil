// Note lifecycle helpers (env-neutral: no DOM/localStorage here).

import type { Note } from "./types.ts";
import { isNote } from "./types.ts";
import { ValidationError } from "./errors.ts";
import { ensure0x, isHex32 } from "./hex.ts";

export function commitmentHex(note: Note): string {
  return ensure0x(note.commitment_hex);
}
export function commitmentDecimal(note: Note): string {
  return note.coin.commitment;
}
export function label(note: Note): string {
  return note.coin.label;
}
export function value(note: Note): string {
  return note.coin.value;
}
export function nullifier(note: Note): string {
  return note.coin.nullifier;
}
export function serialize(note: Note): string {
  return JSON.stringify(note);
}
export function serializePretty(note: Note): string {
  return JSON.stringify(note, null, 2);
}
export function parse(text: string): Note {
  let v: unknown;
  try {
    v = JSON.parse(text);
  } catch {
    throw new ValidationError("note is not valid JSON", "note");
  }
  if (!isNote(v)) throw new ValidationError("not a valid Veil note", "note");
  return v;
}
export function isValid(note: unknown): note is Note {
  if (!isNote(note)) return false;
  return (
    isHex32(note.commitment_hex) &&
    !!note.coin.commitment &&
    !!note.coin.nullifier &&
    !!note.coin.secret &&
    !!note.coin.label
  );
}
export function fingerprint(note: Note): string {
  return ensure0x(note.commitment_hex).slice(0, 18);
}
export function suggestFilename(note: Note, denom: number): string {
  return `veil-note-${denom}-${fingerprint(note).slice(2, 10)}.json`;
}
export function redact(note: Note): { commitment: string; label: string } {
  return { commitment: note.coin.commitment, label: note.coin.label };
}
export function equal(a: Note, b: Note): boolean {
  return a.coin.commitment === b.coin.commitment;
}
export function dedupe(notes: Note[]): Note[] {
  const seen = new Set<string>();
  return notes.filter((n) => (seen.has(n.coin.commitment) ? false : (seen.add(n.coin.commitment), true)));
}
