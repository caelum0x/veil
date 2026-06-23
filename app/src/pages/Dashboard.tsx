import { useEffect, useState } from "react";
import { usePools } from "../hooks/usePools.ts";
import { useStats } from "../hooks/useStats.ts";
import { relayerHealth } from "../lib/api.ts";
import { indexerHealth } from "../lib/indexer.ts";
import { PoolCard } from "../components/PoolCard.tsx";
import { xlm } from "../lib/format.ts";
import { getSettings } from "../lib/settings.ts";

export function Dashboard() {
  const { pools, network } = usePools();
  const stats = useStats();
  const [health, setHealth] = useState<{ relayer: boolean; indexer: boolean }>({ relayer: false, indexer: false });

  useEffect(() => {
    relayerHealth().then(() => setHealth((h) => ({ ...h, relayer: true }))).catch(() => {});
    indexerHealth().then((ok) => setHealth((h) => ({ ...h, indexer: ok })));
  }, []);

  const snapFor = (denom: number) => stats?.pools.find((p) => p.denom === denom);

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <p className="muted">
        Private stablecoin pools on Stellar · network <strong>{network || getSettings().network}</strong>
      </p>

      <div className="totals">
        <div>
          <span className="big">{stats?.totalCommitments ?? "—"}</span>
          <span className="lbl">total deposits</span>
        </div>
        <div>
          <span className="big">{stats?.totalWithdrawals ?? "—"}</span>
          <span className="lbl">withdrawals</span>
        </div>
        <div>
          <span className="big">{stats ? xlm(stats.totalLocked) : "—"}</span>
          <span className="lbl">XLM locked</span>
        </div>
      </div>

      <div className="health-row">
        <span className={health.relayer ? "pill ok" : "pill bad"}>relayer {health.relayer ? "up" : "down"}</span>
        <span className={health.indexer ? "pill ok" : "pill bad"}>indexer {health.indexer ? "up" : "down"}</span>
      </div>

      <h3>Pools</h3>
      {pools.length === 0 ? (
        <p className="warn">No pools loaded — start the relayer and deploy pools.</p>
      ) : (
        <div className="pool-grid">
          {pools.map((p) => (
            <PoolCard key={p.denom} pool={p} snapshot={snapFor(p.denom)} />
          ))}
        </div>
      )}
    </div>
  );
}
