// Keeper configuration.

export interface KeeperConfig {
  network: string;
  relayerUrl: string;
  indexerUrl: string;
  intervalMs: number;
  rootStaleMs: number;
  fillWarnBps: number;
}

export function fromEnv(env: Record<string, string | undefined> = process.env): KeeperConfig {
  return {
    network: env.VEIL_NETWORK ?? "testnet",
    relayerUrl: env.VEIL_RELAYER_URL ?? "http://localhost:8787",
    indexerUrl: env.VEIL_INDEXER_URL ?? "http://localhost:8789",
    intervalMs: Number(env.VEIL_KEEPER_INTERVAL_MS ?? 30000),
    rootStaleMs: Number(env.VEIL_ROOT_STALE_MS ?? 120000),
    fillWarnBps: Number(env.VEIL_FILL_WARN_BPS ?? 8000),
  };
}

export function validate(cfg: KeeperConfig): string[] {
  const errs: string[] = [];
  if (cfg.intervalMs < 1000) errs.push("intervalMs too small (<1000)");
  if (!/^https?:\/\//.test(cfg.relayerUrl)) errs.push("relayerUrl must be http(s)");
  if (!/^https?:\/\//.test(cfg.indexerUrl)) errs.push("indexerUrl must be http(s)");
  return errs;
}

export function describe(cfg: KeeperConfig): string {
  return `network=${cfg.network} interval=${cfg.intervalMs}ms relayer=${cfg.relayerUrl} indexer=${cfg.indexerUrl}`;
}
