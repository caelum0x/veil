import { useEffect, useState, useCallback } from "react";
import { usePools } from "../hooks/usePools.ts";
import { readPool, type PoolOnChain } from "../lib/contract.ts";
import { navigate } from "../lib/router.ts";
import { xlm, shortHex } from "../lib/format.ts";

interface PoolDetailPageProps {
  denom: number;
}

export function PoolDetailPage({ denom }: PoolDetailPageProps) {
  const { pools } = usePools();
  const pool = pools.find((p) => p.denom === denom);
  const [data, setData] = useState<PoolOnChain | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    if (!pool) return;
    setLoading(true);
    setError(null);
    readPool(pool.contractId)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [pool]);

  useEffect(() => {
    load();
  }, [load]);

  if (!pool) {
    return (
      <div className="page">
        <h1>Pool not found</h1>
        <p className="muted">No pool for denomination {denom}.</p>
        <button onClick={() => navigate("/pools")}>← all pools</button>
      </div>
    );
  }

  return (
    <div className="page">
      <button className="back" onClick={() => navigate("/pools")}>
        ← pools
      </button>
      <h1>{xlm(pool.denom)} XLM pool</h1>
      <p className="muted">
        Read live from the contract via Soroban RPC. <code>{pool.contractId}</code>
      </p>
      <button className="primary small" onClick={load} disabled={loading}>
        {loading ? "Reading chain…" : "Refresh from chain"}
      </button>

      {error && <p className="status err">{error}</p>}

      {data && (
        <table className="kv">
          <tbody>
            <tr><td>Denomination</td><td>{xlm(data.denom.toString())} XLM</td></tr>
            <tr><td>Deposits (anonymity set)</td><td>{data.commitmentCount}</td></tr>
            <tr><td>Withdrawals (nullifiers)</td><td>{data.nullifierCount}</td></tr>
            <tr><td>Pool balance</td><td>{xlm(data.balance.toString())} XLM</td></tr>
            <tr><td>Merkle root</td><td className="mono">{shortHex(data.merkleRoot, 20)}</td></tr>
            <tr><td>Root history window</td><td>{data.rootHistory.length} roots</td></tr>
            <tr><td>Association set</td><td>{data.hasAssociation ? "configured" : "not set"}</td></tr>
            <tr><td>Association root</td><td className="mono">{shortHex(data.associationRoot, 20)}</td></tr>
            <tr><td>Admin (ASP)</td><td className="mono">{shortHex(data.admin, 12)}</td></tr>
          </tbody>
        </table>
      )}

      <div className="row-actions">
        <button className="primary" onClick={() => navigate("/deposit")}>Deposit here</button>
        <button onClick={() => navigate("/withdraw")}>Withdraw</button>
      </div>
    </div>
  );
}
