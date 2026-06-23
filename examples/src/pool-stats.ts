// Print live pool stats (anonymity set size, withdrawals, locked value) from the
// indexer.
//
//   npx tsx src/pool-stats.ts

import { createClient, amount } from "../../sdk/src/index.ts";

async function main(): Promise<void> {
  const veil = createClient({ network: "testnet" });
  const stats = await veil.getStats();

  console.log("Denom".padEnd(12), "Deposits".padEnd(10), "Withdrawals".padEnd(12), "Locked");
  for (const p of stats.pools) {
    console.log(
      amount.denomLabel(p.denom).padEnd(12),
      String(p.commitmentCount).padEnd(10),
      String(p.nullifierCount).padEnd(12),
      amount.formatXlm(p.balance),
    );
  }
  console.log(
    `\nTotals: ${stats.totalCommitments} deposits, ${stats.totalWithdrawals} withdrawals, ${amount.formatXlm(stats.totalLocked)} locked.`,
  );
}

main().catch((e) => {
  console.error("error:", e instanceof Error ? e.message : e);
  process.exit(1);
});
