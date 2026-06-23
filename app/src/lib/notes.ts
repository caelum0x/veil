import type { Note } from "./api.ts";

/** Trigger a browser download of a coin note as JSON. */
export function downloadNote(note: Note, denom: number): void {
  const blob = new Blob([JSON.stringify(note, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `veil-note-${denom}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Parse pasted/loaded note text, throwing a friendly error on bad JSON. */
export function parseNote(text: string): Note {
  try {
    return JSON.parse(text) as Note;
  } catch {
    throw new Error("Note is not valid JSON. Paste the note you saved at deposit.");
  }
}
