import { useEffect, useState } from "react";
import { requestWithdrawalProof, type Pool } from "../lib/api.ts";
import { withdraw } from "../lib/stellar.ts";
import { parseNote } from "../lib/notes.ts";
import { xlm, shortHex } from "../lib/format.ts";
import type { Status } from "../types.ts";
import { DenomSelector } from "./DenomSelector.tsx";
import { StatusLine } from "./StatusLine.tsx";

export function WithdrawPanel({
  pools,
  address,
  onNeedWallet,
}: {
  pools: Pool[];
  address: string | null;
  onNeedWallet: () => void;
}) {
  const [denom, setDenom] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");
  const [recipient, setRecipient] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    if (denom === null && pools.length) setDenom(pools[0].denom);
  }, [pools, denom]);

  useEffect(() => {
    if (!recipient && address) setRecipient(address);
  }, [address, recipient]);

  async function onWithdraw() {
    if (denom === null) return;
    if (!recipient) return onNeedWallet();
    let note;
    try {
      note = parseNote(noteText);
    } catch (e) {
      return setStatus({ kind: "err", msg: e instanceof Error ? e.message : String(e) });
    }
    const pool = pools.find((p) => p.denom === denom)!;
    try {
      setStatus({ kind: "busy", msg: "Generating zero-knowledge proof…" });
      const { proofHex, publicHex } = await requestWithdrawalProof(denom, note, recipient);
      setStatus({ kind: "busy", msg: "Confirm the withdrawal in Freighter…" });
      const { hash } = await withdraw(pool.contractId, recipient, proofHex, publicHex);
      setStatus({
        kind: "ok",
        msg: `Withdrew ${xlm(denom)} XLM — tx ${shortHex(hash)}`,
      });
    } catch (e) {
      setStatus({ kind: "err", msg: e instanceof Error ? e.message : String(e) });
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) file.text().then(setNoteText);
  }

  return (
    <section className="card">
      <h2>Withdraw from a pool</h2>
      <p className="hint">
        A Groth16 proof is generated from your note and verified on-chain. The pool releases funds to the recipient
        with no on-chain link to the original deposit.
      </p>

      <label>Denomination</label>
      <DenomSelector pools={pools} denom={denom} onSelect={setDenom} />

      <label>Note</label>
      <textarea
        placeholder="Paste your saved note JSON here"
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        rows={4}
      />
      <input type="file" accept="application/json" onChange={onFile} />

      <label>Recipient (Stellar address)</label>
      <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="G…" />

      <button className="primary" disabled={status.kind === "busy" || !noteText} onClick={onWithdraw}>
        Withdraw
      </button>
      <StatusLine status={status} />
    </section>
  );
}
