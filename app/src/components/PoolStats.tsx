import { useStats } from "../hooks/useStats.ts";
import { xlm, shortHex } from "../lib/format.ts";

/**
 * Live pool dashboard. Reads from the indexer service, which polls each pool's
 * on-chain getters. The "anonymity set" column is the headline privacy metric — the
 * larger it is, the more deposits a withdrawal could plausibly have come from.
 */
export function PoolStats() {
  const stats = useStats();

  if (!stats)
    return (
      <section className="card">
        <h2>Pools</h2>
        <p className="hint">
          Waiting for the indexer (<code>services/indexer</code>) at <code>:8789</code>…
        </p>
      </section>
    );

  return (
    <section className="card">
      <h2>Pools</h2>
      <div className="totals">
        <div>
          <span className="big">{stats.totalCommitments}</span>
          <span className="lbl">deposits</span>
        </div>
        <div>
          <span className="big">{stats.totalWithdrawals}</span>
          <span className="lbl">withdrawals</span>
        </div>
        <div>
          <span className="big">{xlm(stats.totalLocked)}</span>
          <span className="lbl">XLM locked</span>
        </div>
      </div>

      <table className="pools-table">
        <thead>
          <tr>
            <th>Denom</th>
            <th>Anonymity set</th>
            <th>Withdrawals</th>
            <th>Locked</th>
            <th>Root</th>
          </tr>
        </thead>
        <tbody>
          {stats.pools.map((p) => (
            <tr key={p.denom}>
              <td>{xlm(p.denom)} XLM</td>
              <td>{p.error ? "—" : p.commitmentCount}</td>
              <td>{p.error ? "—" : p.nullifierCount}</td>
              <td>{p.error ? "—" : `${xlm(p.balance)} XLM`}</td>
              <td className="mono">{p.error ? "unreachable" : shortHex(p.merkleRoot, 12)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
