import { navigate, parseRoute } from "../lib/router.ts";
import { shortAddr } from "../lib/format.ts";

interface NavBarProps {
  route: string;
  address: string | null;
  onConnect: () => void;
}

const LINKS: { page: string; label: string }[] = [
  { page: "dashboard", label: "Dashboard" },
  { page: "deposit", label: "Deposit" },
  { page: "withdraw", label: "Withdraw" },
  { page: "pools", label: "Pools" },
  { page: "notes", label: "Notes" },
  { page: "settings", label: "Settings" },
];

export function NavBar({ route, address, onConnect }: NavBarProps) {
  const active = parseRoute(route).page;
  return (
    <header className="nav">
      <div className="brand" onClick={() => navigate("/dashboard")} role="button">
        <span className="logo">◈</span> Veil
      </div>
      <nav className="nav-links">
        {LINKS.map((l) => (
          <a
            key={l.page}
            className={active === l.page ? "nav-link active" : "nav-link"}
            href={`#/${l.page}`}
          >
            {l.label}
          </a>
        ))}
      </nav>
      {address ? (
        <span className="wallet" title={address}>
          {shortAddr(address)}
        </span>
      ) : (
        <button className="connect" onClick={onConnect}>
          Connect
        </button>
      )}
    </header>
  );
}
