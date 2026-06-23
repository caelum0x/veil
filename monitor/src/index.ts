// Veil monitor entry point — poll loop + HTTP server.

import { fromEnv, describe } from "./config.ts";
import { Probes } from "./probes.ts";
import { buildReport } from "./scoring.ts";
import { History } from "./history.ts";
import { createMonitorServer, type MonitorState } from "./server.ts";

const cfg = fromEnv();
const probes = new Probes(cfg);
const history = new History(cfg.historySize);
let state: MonitorState | null = null;

async function poll(): Promise<void> {
  const { probes: results, stats } = await probes.all();
  const report = buildReport(results, stats, cfg.fillWarnBps);
  history.record(report);
  state = { report, stats };
}

const server = createMonitorServer(() => state, history);
server.listen(cfg.port, () => {
  console.log(`▸ Veil monitor — ${describe(cfg)}`);
  console.log(`  dashboard: http://localhost:${cfg.port}/  ·  metrics: /metrics  ·  health: /health`);
});

void poll();
const timer = setInterval(() => void poll(), cfg.pollMs);

process.on("SIGINT", () => {
  clearInterval(timer);
  server.close();
  process.exit(0);
});
