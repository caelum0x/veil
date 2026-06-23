import { useEffect, useState } from "react";
import { getStats, type Stats } from "../lib/indexer.ts";

/** Polls the indexer for live pool stats. Null while loading or if unreachable. */
export function useStats(pollMs = 15000) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let active = true;
    const load = () => getStats().then((s) => active && s && setStats(s));
    load();
    const t = setInterval(load, pollMs);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [pollMs]);

  return stats;
}
