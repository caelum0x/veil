import { usePools } from "../hooks/usePools.ts";
import { useWallet } from "../hooks/useWallet.ts";
import { DepositPanel } from "../components/DepositPanel.tsx";

export function DepositPage() {
  const { pools } = usePools();
  const { address, connect } = useWallet();
  return (
    <div className="page">
      <DepositPanel pools={pools} address={address} onNeedWallet={connect} />
    </div>
  );
}
