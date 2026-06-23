import { useState } from "react";
import { loadAll, remove, markWithdrawn, exportAll, importAll, type StoredNote } from "../lib/storage.ts";
import { downloadNote } from "../lib/notes.ts";
import { downloadText, copyJson } from "../lib/clipboard.ts";
import { xlm, shortHex } from "../lib/format.ts";
import { relative } from "../lib/time.ts";
import { navigate } from "../lib/router.ts";

export function NotesPage() {
  const [notes, setNotes] = useState<StoredNote[]>(() => loadAll());
  const refresh = () => setNotes(loadAll());

  function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((t) => {
      importAll(t);
      refresh();
    });
  }

  return (
    <div className="page">
      <h1>Notes vault</h1>
      <p className="muted">
        Saved withdrawal notes (stored locally in this browser). A note is the secret needed to withdraw a deposit.
      </p>

      <div className="row-actions">
        <button onClick={() => downloadText(exportAll(), `veil-notes-${Date.now()}.json`, "application/json")}>
          Export all
        </button>
        <label className="filebtn">
          Import
          <input type="file" accept="application/json" onChange={onImport} hidden />
        </label>
      </div>

      {notes.length === 0 ? (
        <p className="muted">No saved notes yet. Deposits you make here are saved automatically.</p>
      ) : (
        <table className="kv notes">
          <thead>
            <tr><th>Denom</th><th>Commitment</th><th>Created</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {notes.map((n) => (
              <tr key={n.id}>
                <td>{xlm(n.denom)} XLM</td>
                <td className="mono">{shortHex(n.commitmentHex, 14)}</td>
                <td>{relative(n.createdAt)}</td>
                <td>{n.withdrawn ? "withdrawn" : "active"}</td>
                <td className="note-actions">
                  <button onClick={() => copyJson(n.note)}>copy</button>
                  <button onClick={() => downloadNote(n.note, n.denom)}>save</button>
                  {!n.withdrawn && <button onClick={() => navigate("/withdraw")}>withdraw</button>}
                  {!n.withdrawn && (
                    <button onClick={() => { markWithdrawn(n.id); refresh(); }}>mark spent</button>
                  )}
                  <button className="danger" onClick={() => { remove(n.id); refresh(); }}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
