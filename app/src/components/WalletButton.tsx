import { shortAddr } from "../lib/format.ts";

export function WalletButton({ address, onConnect }: { address: string | null; onConnect: () => void }) {
  if (address) return <span className="wallet">{shortAddr(address)}</span>;
  return (
    <button className="connect" onClick={onConnect}>
      Connect Freighter
    </button>
  );
}
