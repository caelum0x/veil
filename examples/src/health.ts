// Check whether the relayer and indexer are reachable.
//
//   npx tsx src/health.ts

import { createClient } from "../../sdk/src/index.ts";

async function main(): Promise<void> {
  const veil = createClient({ network: "testnet" });
  const h = await veil.health();
  console.log(`relayer: ${h.relayer ? "up ✅" : "down ❌"}`);
  console.log(`indexer: ${h.indexer ? "up ✅" : "down ❌"}`);
  if (!h.relayer || !h.indexer) process.exit(1);
}

main().catch((e) => {
  console.error("error:", e instanceof Error ? e.message : e);
  process.exit(1);
});
