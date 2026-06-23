import { useEffect, useState } from "react";
import { mintNote, confirmDeposit, type Pool, type Note } from "../lib/api.ts";
import { deposit } from "../lib/stellar.ts";
import { downloadNote } from "../lib/notes.ts";
import { add as saveNote } from "../lib/storage.ts";
import { shortHex } from "../lib/format.ts";
import type { Status } from "../types.ts";
import { DenomSelector } from "./DenomSelector.tsx";
import { StatusLine } from "./StatusLine.tsx";

export function DepositPanel({
  pools,
  address,
  onNeedWallet,
}: {
  pools: Pool[];
  address: string | null;
  onNeedWallet: () => void;
}) {
  const [denom, setDenom] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [note, setNote] = useState<Note | null>(null);

  useEffect(() => {
    if (denom === null && pools.length) setDenom(pools[0].denom);
  }, [pools, denom]);

  async function onDeposit() {
    if (!address) return onNeedWallet();
    if (denom === null) return;
    const pool = pools.find((p) => p.denom === denom)!;
    setNote(null);
    try {
      setStatus({ kind: "busy", msg: "Minting commitment…" });
      const { note, commitmentHex } = await mintNote(denom);
      setStatus({ kind: "busy", msg: "Confirm the deposit in Freighter…" });
      const { hash } = await deposit(pool.contractId, address, commitmentHex);
      setStatus({ kind: "busy", msg: "Publishing association root…" });
      await confirmDeposit(denom, note);
      // Persist the note to the local vault so it survives a page reload.
      saveNote({ denom, note, commitmentHex });
      setNote(note);
      setStatus({ kind: "ok", msg: `Deposited. tx ${shortHex(hash)} — saved to your Notes vault.` });
    } catch (e) {
      setStatus({ kind: "err", msg: e instanceof Error ? e.message : String(e) });
    }
  }

  return (
    <section className="card">
      <h2>Deposit into a pool</h2>
      <p className="hint">
        Each deposit is a fixed denomination. You get a secret <em>note</em> — keep it safe; it is the only way to
        withdraw, and it is what makes the withdrawal unlinkable to this deposit.
      </p>

      <label>Denomination</label>
      <DenomSelector pools={pools} denom={denom} onSelect={setDenom} />

      <button className="primary" disabled={status.kind === "busy" || denom === null} onClick={onDeposit}>
        {address ? "Deposit" : "Connect wallet to deposit"}
      </button>
      <StatusLine status={status} />

      {note != null && (
        <div className="note-box">
          <strong>Your withdrawal note</strong>
          <textarea readOnly value={JSON.stringify(note)} rows={4} />
          <button onClick={() => downloadNote(note, denom ?? 0)}>Download note</button>
        </div>
      )}
    </section>
  );
}
