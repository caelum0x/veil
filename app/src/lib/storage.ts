// Local note vault — persists withdrawal notes in localStorage so a user can manage
// them in the browser. Notes are the secret needed to withdraw; this is convenience
// storage, not secure storage.

import type { Note } from "./api.ts";

export interface StoredNote {
  id: string;
  denom: number;
  note: Note;
  commitmentHex: string;
  createdAt: number;
  withdrawn?: boolean;
}

const KEY = "veil.notes.v1";

export function loadAll(): StoredNote[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as StoredNote[];
  } catch {
    return [];
  }
}

function persist(notes: StoredNote[]): void {
  localStorage.setItem(KEY, JSON.stringify(notes));
}

export function add(entry: Omit<StoredNote, "id" | "createdAt">): StoredNote {
  const stored: StoredNote = { ...entry, id: genId(), createdAt: Date.now() };
  persist([stored, ...loadAll()]);
  return stored;
}

export function remove(id: string): void {
  persist(loadAll().filter((n) => n.id !== id));
}

export function get(id: string): StoredNote | undefined {
  return loadAll().find((n) => n.id === id);
}

export function markWithdrawn(id: string): void {
  persist(loadAll().map((n) => (n.id === id ? { ...n, withdrawn: true } : n)));
}

export function byDenom(denom: number): StoredNote[] {
  return loadAll().filter((n) => n.denom === denom);
}

export function active(): StoredNote[] {
  return loadAll().filter((n) => !n.withdrawn);
}

export function count(): number {
  return loadAll().length;
}

export function clear(): void {
  localStorage.removeItem(KEY);
}

export function exportAll(): string {
  return JSON.stringify(loadAll(), null, 2);
}

export function importAll(json: string): number {
  const incoming = JSON.parse(json) as StoredNote[];
  const merged = [...incoming, ...loadAll()];
  const seen = new Set<string>();
  const deduped = merged.filter((n) => (seen.has(n.id) ? false : (seen.add(n.id), true)));
  persist(deduped);
  return incoming.length;
}

function genId(): string {
  return `${Date.now().toString(36)}-${Math.floor(performance.now()).toString(36)}`;
}
