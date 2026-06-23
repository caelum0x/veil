import type { Pool } from "../lib/api.ts";
import { xlm } from "../lib/format.ts";

export function DenomSelector({
  pools,
  denom,
  onSelect,
}: {
  pools: Pool[];
  denom: number | null;
  onSelect: (d: number) => void;
}) {
  return (
    <div className="denoms">
      {pools.map((p) => (
        <button
          key={p.denom}
          className={denom === p.denom ? "denom active" : "denom"}
          onClick={() => onSelect(p.denom)}
        >
          {xlm(p.denom)} XLM
        </button>
      ))}
    </div>
  );
}
