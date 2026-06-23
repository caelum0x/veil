// Demonstrate the withdrawal flow with the SDK.
//
//   npx tsx src/withdraw-flow.ts <denomStroops> <recipientG...> <noteFile.json>
//
// The SDK generates a Groth16 withdrawal proof from your note. Submitting the
// resulting `withdraw(...)` call still needs a wallet (the recipient signs).

import { readFileSync } from "node:fs";
import { createClient, notes, amount, strkey } from "../../sdk/src/index.ts";

async function main(): Promise<void> {
  const denom = Number(process.argv[2] ?? amount.DENOMS[0]);
  const recipient = process.argv[3] ?? "";
  const noteFile = process.argv[4] ?? "";

  if (!strkey.isAccount(recipient)) {
    console.error("usage: withdraw-flow.ts <denom> <recipient G...> <noteFile.json>");
    process.exit(1);
  }
  const note = notes.parse(readFileSync(noteFile, "utf8"));
  const veil = createClient({ network: "testnet" });

  console.log(`Generating a zero-knowledge proof to withdraw ${amount.denomLabel(denom)} to ${strkey.shorten(recipient)}…`);
  const proof = await veil.prepareWithdrawal(denom, note, recipient);

  console.log(`\nSubmit this on-chain (the recipient signs):`);
  console.log(`   contract: ${proof.contractId}`);
  console.log(`   call:     withdraw(to = ${recipient}, proof_bytes = <hex>, pub_signals_bytes = <hex>)`);
  console.log(`   proofHex  length: ${proof.proofHex.length}`);
  console.log(`   publicHex length: ${proof.publicHex.length}`);
}

main().catch((e) => {
  console.error("error:", e instanceof Error ? e.message : e);
  process.exit(1);
});
