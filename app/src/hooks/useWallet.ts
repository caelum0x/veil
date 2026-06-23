import { useEffect, useState } from "react";
import { connectWallet, currentAddress } from "../lib/stellar.ts";

/** Tracks the connected Freighter address and exposes a connect action. */
export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    currentAddress().then(setAddress);
  }, []);

  const connect = () =>
    connectWallet()
      .then((a) => {
        setAddress(a);
        setError(null);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));

  return { address, error, connect };
}
