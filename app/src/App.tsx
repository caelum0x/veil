import { useRoute, parseRoute } from "./lib/router.ts";
import { useWallet } from "./hooks/useWallet.ts";
import { NavBar } from "./components/NavBar.tsx";
import { Dashboard } from "./pages/Dashboard.tsx";
import { DepositPage } from "./pages/DepositPage.tsx";
import { WithdrawPage } from "./pages/WithdrawPage.tsx";
import { PoolsPage } from "./pages/PoolsPage.tsx";
import { PoolDetailPage } from "./pages/PoolDetailPage.tsx";
import { NotesPage } from "./pages/NotesPage.tsx";
import { SettingsPage } from "./pages/SettingsPage.tsx";

export function App() {
  const route = useRoute();
  const { address, connect } = useWallet();
  const { page, params } = parseRoute(route);

  function renderPage() {
    switch (page) {
      case "deposit":
        return <DepositPage />;
      case "withdraw":
        return <WithdrawPage />;
      case "pools":
        return params[0] ? <PoolDetailPage denom={Number(params[0])} /> : <PoolsPage />;
      case "notes":
        return <NotesPage />;
      case "settings":
        return <SettingsPage />;
      case "dashboard":
      default:
        return <Dashboard />;
    }
  }

  return (
    <div className="shell">
      <NavBar route={route} address={address} onConnect={connect} />
      <main>{renderPage()}</main>
      <footer>
        Veil · Groth16 / BLS12-381 verified on-chain · withdrawals reveal the pool, never the funding deposit
      </footer>
    </div>
  );
}
