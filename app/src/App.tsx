import { useState } from "react";
import { usePools } from "./hooks/usePools.ts";
import { useWallet } from "./hooks/useWallet.ts";
import type { Tab } from "./types.ts";
import { WalletButton } from "./components/WalletButton.tsx";
import { DepositPanel } from "./components/DepositPanel.tsx";
import { WithdrawPanel } from "./components/WithdrawPanel.tsx";
import { PoolStats } from "./components/PoolStats.tsx";

export function App() {
  const { pools, network } = usePools();
  const { address, connect } = useWallet();
  const [tab, setTab] = useState<Tab>("deposit");

  return (
    <div className="shell">
      <header>
        <div className="brand">
          <span className="logo">◈</span> Veil
          <span className="tagline">private stablecoin pools on Stellar</span>
        </div>
        <WalletButton address={address} onConnect={connect} />
      </header>

      <main>
        <div className="tabs">
          <button className={tab === "deposit" ? "active" : ""} onClick={() => setTab("deposit")}>
            Deposit
          </button>
          <button className={tab === "withdraw" ? "active" : ""} onClick={() => setTab("withdraw")}>
            Withdraw
          </button>
          <button className={tab === "pools" ? "active" : ""} onClick={() => setTab("pools")}>
            Pools
          </button>
        </div>

        {pools.length === 0 && tab !== "pools" && (
          <p className="warn">
            No pools loaded. Start the relayer and deploy pools (<code>scripts/deploy-pools.sh</code>).
          </p>
        )}

        {tab === "deposit" && <DepositPanel pools={pools} address={address} onNeedWallet={connect} />}
        {tab === "withdraw" && <WithdrawPanel pools={pools} address={address} onNeedWallet={connect} />}
        {tab === "pools" && <PoolStats />}
      </main>

      <footer>
        network: <strong>{network}</strong> · ZK: Groth16 / BLS12-381 verified on-chain · proofs never reveal which
        deposit funded a withdrawal
      </footer>
    </div>
  );
}
