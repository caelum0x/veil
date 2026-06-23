// Runtime app configuration. Defaults come from build-time VITE_* env vars but can
// be overridden in-app (Settings page) and persist to localStorage.

export interface AppSettings {
  network: string;
  relayerUrl: string;
  indexerUrl: string;
  rpcUrl: string;
  demo: boolean;
}

const KEY = "veil.settings.v2";

// Demo mode is on by default so the app is fully interactive with no backend.
// Set VITE_DEMO=false at build time (or toggle in Settings) to use a real relayer.
const demoDefault = String(import.meta.env.VITE_DEMO ?? "true").toLowerCase() !== "false";

const defaults: AppSettings = {
  network: import.meta.env.VITE_NETWORK ?? "testnet",
  relayerUrl: import.meta.env.VITE_RELAYER_URL ?? "http://localhost:8787",
  indexerUrl: import.meta.env.VITE_INDEXER_URL ?? "http://localhost:8789",
  rpcUrl: import.meta.env.VITE_RPC_URL ?? "https://soroban-testnet.stellar.org",
  demo: demoDefault,
};

function load(): AppSettings {
  try {
    return { ...defaults, ...(JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<AppSettings>) };
  } catch {
    return { ...defaults };
  }
}

let current: AppSettings = load();

export function getSettings(): AppSettings {
  return current;
}

export function saveSettings(patch: Partial<AppSettings>): AppSettings {
  current = { ...current, ...patch };
  localStorage.setItem(KEY, JSON.stringify(current));
  return current;
}

export function resetSettings(): AppSettings {
  localStorage.removeItem(KEY);
  current = { ...defaults };
  return current;
}

export function defaultSettings(): AppSettings {
  return { ...defaults };
}
