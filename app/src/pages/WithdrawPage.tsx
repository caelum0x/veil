import { usePools } from "../hooks/usePools.ts";
import { useWallet } from "../hooks/useWallet.ts";
import { WithdrawPanel } from "../components/WithdrawPanel.tsx";

export function WithdrawPage() {
  const { pools } = usePools();
  const { address, connect } = useWallet();
  return (
    <div className="page">
      <WithdrawPanel pools={pools} address={address} onNeedWallet={connect} />
    </div>
  );
}
