import { loadConfig } from "./config.js";
import { SnapshotStore } from "./store.js";
import { Poller } from "./poller.js";
import { createServer } from "./server.js";

const cfg = loadConfig();
const store = new SnapshotStore();
const poller = new Poller(cfg, store);
poller.start();

const app = createServer(cfg, store);
app.listen(cfg.port, () => {
  console.log(`▸ Veil indexer`);
  console.log(`  network : ${cfg.manifest.network}`);
  console.log(`  pools   : ${cfg.manifest.pools.map((p) => p.denom).join(", ")}`);
  console.log(`  polling : every ${cfg.pollIntervalMs}ms`);
  console.log(`  listening on http://localhost:${cfg.port}`);
});

process.on("SIGINT", () => {
  poller.stop();
  process.exit(0);
});
