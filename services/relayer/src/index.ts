import { loadConfig } from "./config.js";
import { createServer } from "./server.js";

const cfg = loadConfig();
const app = createServer(cfg);

app.listen(cfg.port, () => {
  console.log(`▸ Veil relayer/ASP coordinator`);
  console.log(`  network : ${cfg.network}`);
  console.log(`  admin   : ${cfg.adminIdentity}`);
  console.log(`  pools   : ${cfg.manifest.pools.map((p) => p.denom).join(", ")}`);
  console.log(`  listening on http://localhost:${cfg.port}`);
});
