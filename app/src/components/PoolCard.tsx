import type { Pool } from "../lib/api.ts";
import type { PoolSnapshot } from "../lib/indexer.ts";
import { navigate } from "../lib/router.ts";
import { xlm } from "../lib/format.ts";

interface PoolCardProps {
  pool: Pool;
  snapshot?: PoolSnapshot;
}

export function PoolCard({ pool, snapshot }: PoolCardProps) {
  return (
    <button className="pool-card" onClick={() => navigate(`/pools/${pool.denom}`)}>
      <div className="pool-card-denom">{xlm(pool.denom)} XLM</div>
      <div className="pool-card-stats">
        <span>
          <strong>{snapshot?.commitmentCount ?? "—"}</strong> deposits
        </span>
        <span>
          <strong>{snapshot?.nullifierCount ?? "—"}</strong> withdrawals
        </span>
      </div>
      <div className="pool-card-cid">{pool.contractId.slice(0, 8)}…{pool.contractId.slice(-6)}</div>
    </button>
  );
}
