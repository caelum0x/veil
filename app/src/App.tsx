import { useEffect, useState } from "react";
import {
  getPools,
  mintNote,
  confirmDeposit,
  requestWithdrawalProof,
  type Pool,
  type Note,
} from "./lib/api.ts";
import { connectWallet, currentAddress, deposit, withdraw } from "./lib/stellar.ts";

type Tab = "deposit" | "withdraw";
type Status = { kind: "idle" | "busy" | "ok" | "err"; msg?: string };

const xlm = (stroops: number) => (stroops / 1e9).toLocaleString();

export function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [pools, setPools] = useState<Pool[]>([]);
  const [network, setNetwork] = useState("testnet");
  const [tab, setTab] = useState<Tab>("deposit");

  useEffect(() => {
    currentAddress().then(setAddress);
    getPools()
      .then((r) => {
        setPools(r.pools);
        setNetwork(r.network);
      })
      .catch(() => setPools([]));
  }, []);

  return (
    <div className="shell">
      <header>
        <div className="brand">
          <span className="logo">◈</span> Veil
          <span className="tagline">private stablecoin pools on Stellar</span>
        </div>
        <WalletButton address={address} onConnect={() => connectWallet().then(setAddress)} />
      </header>

      <main>
        <div className="tabs">
          <button className={tab === "deposit" ? "active" : ""} onClick={() => setTab("deposit")}>
            Deposit
          </button>
          <button className={tab === "withdraw" ? "active" : ""} onClick={() => setTab("withdraw")}>
            Withdraw
          </button>
        </div>

        {pools.length === 0 && (
          <p className="warn">
            No pools loaded. Start the relayer and deploy pools (<code>scripts/deploy-pools.sh</code>).
          </p>
        )}

        {tab === "deposit" ? (
          <DepositPanel pools={pools} address={address} onNeedWallet={() => connectWallet().then(setAddress)} />
        ) : (
          <WithdrawPanel pools={pools} address={address} onNeedWallet={() => connectWallet().then(setAddress)} />
        )}
      </main>

      <footer>
        network: <strong>{network}</strong> · ZK: Groth16 / BLS12-381 verified on-chain · proofs never reveal which
        deposit funded a withdrawal
      </footer>
    </div>
  );
}

function WalletButton({ address, onConnect }: { address: string | null; onConnect: () => void }) {
  if (address)
    return (
      <span className="wallet">
        {address.slice(0, 6)}…{address.slice(-6)}
      </span>
    );
  return (
    <button className="connect" onClick={onConnect}>
      Connect Freighter
    </button>
  );
}

function StatusLine({ status }: { status: Status }) {
  if (status.kind === "idle") return null;
  return <p className={`status ${status.kind}`}>{status.msg}</p>;
}

function DepositPanel({
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
      setNote(note);
      setStatus({ kind: "ok", msg: `Deposited. tx ${hash.slice(0, 10)}… — save your note below.` });
    } catch (e) {
      setStatus({ kind: "err", msg: e instanceof Error ? e.message : String(e) });
    }
  }

  function downloadNote() {
    const blob = new Blob([JSON.stringify(note, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `veil-note-${denom}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="card">
      <h2>Deposit into a pool</h2>
      <p className="hint">
        Each deposit is a fixed denomination. You get a secret <em>note</em> — keep it safe; it is the only way to
        withdraw, and it is what makes the withdrawal unlinkable to this deposit.
      </p>

      <label>Denomination</label>
      <div className="denoms">
        {pools.map((p) => (
          <button
            key={p.denom}
            className={denom === p.denom ? "denom active" : "denom"}
            onClick={() => setDenom(p.denom)}
          >
            {xlm(p.denom)} XLM
          </button>
        ))}
      </div>

      <button className="primary" disabled={status.kind === "busy" || denom === null} onClick={onDeposit}>
        {address ? "Deposit" : "Connect wallet to deposit"}
      </button>
      <StatusLine status={status} />

      {note != null && (
        <div className="note-box">
          <strong>Your withdrawal note</strong>
          <textarea readOnly value={JSON.stringify(note)} rows={4} />
          <button onClick={downloadNote}>Download note</button>
        </div>
      )}
    </section>
  );
}

function WithdrawPanel({
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
    let note: Note;
    try {
      note = JSON.parse(noteText);
    } catch {
      return setStatus({ kind: "err", msg: "Note is not valid JSON. Paste the note you saved at deposit." });
    }
    const pool = pools.find((p) => p.denom === denom)!;
    try {
      setStatus({ kind: "busy", msg: "Generating zero-knowledge proof…" });
      const { proofHex, publicHex } = await requestWithdrawalProof(denom, note, recipient);
      setStatus({ kind: "busy", msg: "Confirm the withdrawal in Freighter…" });
      const { hash } = await withdraw(pool.contractId, recipient, proofHex, publicHex);
      setStatus({ kind: "ok", msg: `Withdrawn ${xlm(denom)} XLM to ${recipient.slice(0, 8)}… — tx ${hash.slice(0, 10)}…` });
    } catch (e) {
      setStatus({ kind: "err", msg: e instanceof Error ? e.message : String(e) });
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(setNoteText);
  }

  return (
    <section className="card">
      <h2>Withdraw from a pool</h2>
      <p className="hint">
        A Groth16 proof is generated from your note and verified on-chain. The pool releases funds to the recipient
        with no on-chain link to the original deposit.
      </p>

      <label>Denomination</label>
      <div className="denoms">
        {pools.map((p) => (
          <button
            key={p.denom}
            className={denom === p.denom ? "denom active" : "denom"}
            onClick={() => setDenom(p.denom)}
          >
            {xlm(p.denom)} XLM
          </button>
        ))}
      </div>

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
