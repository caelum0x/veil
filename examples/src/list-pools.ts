// List the available privacy pools via the SDK.
//
//   npx tsx src/list-pools.ts

import { createClient, amount } from "../../sdk/src/index.ts";

async function main(): Promise<void> {
  const veil = createClient({ network: "testnet" });
  const pools = await veil.getPools();

  console.log(`Veil pools on ${veil.config.network}:`);
  for (const p of pools) {
    console.log(`  ${amount.denomLabel(p.denom).padEnd(12)} ${p.contractId}`);
  }
  console.log(`\n${pools.length} pools.`);
}

main().catch((e) => {
  console.error("error:", e instanceof Error ? e.message : e);
  process.exit(1);
});
