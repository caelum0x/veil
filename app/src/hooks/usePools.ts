import { useEffect, useState } from "react";
import { getPools, type Pool } from "../lib/api.ts";

/** Loads the pool list from the relayer once on mount. */
export function usePools() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [network, setNetwork] = useState("testnet");
  const [token, setToken] = useState("");

  useEffect(() => {
    getPools()
      .then((r) => {
        setPools(r.pools);
        setNetwork(r.network);
        setToken(r.token);
      })
      .catch(() => setPools([]));
  }, []);

  return { pools, network, token };
}
