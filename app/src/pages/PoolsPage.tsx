import { usePools } from "../hooks/usePools.ts";
import { useStats } from "../hooks/useStats.ts";
import { PoolCard } from "../components/PoolCard.tsx";

export function PoolsPage() {
  const { pools } = usePools();
  const stats = useStats();

  return (
    <div className="page">
      <h1>Pools</h1>
      <p className="muted">Each denomination is an independent anonymity set. Click a pool for on-chain detail.</p>
      {pools.length === 0 ? (
        <p className="warn">No pools loaded.</p>
      ) : (
        <div className="pool-grid">
          {pools.map((p) => (
            <PoolCard key={p.denom} pool={p} snapshot={stats?.pools.find((s) => s.denom === p.denom)} />
          ))}
        </div>
      )}
    </div>
  );
}
