// Monitor configuration.

export interface MonitorConfig {
  port: number;
  relayerUrl: string;
  indexerUrl: string;
  pollMs: number;
  historySize: number;
  /** Pool fill (basis points) at which health is degraded. */
  fillWarnBps: number;
}

export function fromEnv(env: Record<string, string | undefined> = process.env): MonitorConfig {
  return {
    port: Number(env.PORT ?? 8790),
    relayerUrl: env.VEIL_RELAYER_URL ?? "http://localhost:8787",
    indexerUrl: env.VEIL_INDEXER_URL ?? "http://localhost:8789",
    pollMs: Number(env.VEIL_MONITOR_POLL_MS ?? 15000),
    historySize: Number(env.VEIL_MONITOR_HISTORY ?? 240),
    fillWarnBps: Number(env.VEIL_FILL_WARN_BPS ?? 8000),
  };
}

export function describe(cfg: MonitorConfig): string {
  return `port=${cfg.port} relayer=${cfg.relayerUrl} indexer=${cfg.indexerUrl} poll=${cfg.pollMs}ms`;
}
