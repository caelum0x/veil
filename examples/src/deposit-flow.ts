// Demonstrate the deposit flow with the SDK.
//
//   npx tsx src/deposit-flow.ts [denomStroops]
//
// The SDK prepares the deposit (mints a coin note + commitment) and registers it,
// but it does NOT sign Stellar transactions — that needs a wallet/keypair the caller
// controls. So this script prints the commitment to submit and the note to keep.

import { createClient, notes, amount } from "../../sdk/src/index.ts";

async function main(): Promise<void> {
  const denom = Number(process.argv[2] ?? amount.DENOMS[0]);
  const veil = createClient({ network: "testnet" });

  console.log(`Preparing a deposit into the ${amount.denomLabel(denom)} pool…`);
  const minted = await veil.prepareDeposit(denom);

  console.log(`\n1. Submit this on-chain (deposit pays ${amount.denomLabel(denom)} from your account):`);
  console.log(`   contract: ${minted.contractId}`);
  console.log(`   call:     deposit(from = <your address>, commitment = ${minted.commitmentHex})`);

  console.log(`\n2. SAVE THIS NOTE — it is the only way to withdraw:`);
  console.log(`   ${notes.serialize(minted.note)}`);
  console.log(`   fingerprint: ${notes.fingerprint(minted.note)}`);

  console.log(`\n3. After the deposit confirms, register it so the coin becomes withdrawable:`);
  console.log(`   await veil.finalizeDeposit(${denom}, note)`);
}

main().catch((e) => {
  console.error("error:", e instanceof Error ? e.message : e);
  process.exit(1);
});
