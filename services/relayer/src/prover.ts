import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { run } from "./exec.js";
import type { RelayerConfig } from "./config.js";
import type { StateStore } from "./state.js";

export interface WithdrawalProof {
  /** Hex-encoded Groth16 proof, ready for the contract's `withdraw`. */
  proofHex: string;
  /** Hex-encoded public signals. */
  publicHex: string;
}

/** Extracts the hex line that follows a labelled header in circom2soroban output. */
function hexAfter(header: string, out: string): string {
  const lines = out.split("\n");
  const idx = lines.findIndex((l) => l.includes(header));
  if (idx === -1 || idx + 1 >= lines.length)
    throw new Error(`could not find "${header}" in circom2soroban output`);
  return lines[idx + 1].trim().replace(/^0x/i, "");
}

/**
 * Generates a Groth16 withdrawal proof for a coin against the current pool state.
 *
 * Pipeline (mirrors demo.sh, but isolated per-request): coinutils builds the SNARK
 * input (Merkle paths + association proof) -> snarkjs witness -> snarkjs groth16
 * prove -> circom2soroban converts proof + public signals to the contract's hex.
 */
export class Prover {
  constructor(
    private cfg: RelayerConfig,
    private state: StateStore,
  ) {}

  async prove(scope: string, note: unknown, requestId: string): Promise<WithdrawalProof> {
    const work = resolve(this.cfg.paths.work, requestId);
    mkdirSync(work, { recursive: true });

    const coinFile = resolve(work, "coin.json");
    writeFileSync(coinFile, JSON.stringify(note, null, 2));

    const stateFile = this.state.writeStateFile(scope);
    const assocFile = this.state.associationFile(scope);
    const withdrawalInput = resolve(work, "withdrawal_input.json");

    // 1. Build SNARK input (Merkle inclusion + association membership).
    await run(this.cfg.paths.coinutils, [
      "withdraw",
      coinFile,
      stateFile,
      assocFile,
      "-o",
      withdrawalInput,
    ]);

    // 2. Witness.
    const witness = resolve(work, "witness.wtns");
    await run("node", [this.cfg.paths.generateWitness, this.cfg.paths.circuitWasm, withdrawalInput, witness]);

    // 3. Groth16 prove.
    const proofJson = resolve(work, "proof.json");
    const publicJson = resolve(work, "public.json");
    await run("npx", ["snarkjs", "groth16", "prove", this.cfg.paths.zkey, witness, proofJson, publicJson], {
      cwd: this.cfg.paths.work,
    });

    // 4. Convert to Soroban hex.
    const proofOut = await run(this.cfg.paths.circom2soroban, ["proof", proofJson]);
    const publicOut = await run(this.cfg.paths.circom2soroban, ["public", publicJson]);

    return {
      proofHex: hexAfter("Proof Hex encoding:", proofOut.stdout),
      publicHex: hexAfter("Public signals Hex encoding:", publicOut.stdout),
    };
  }
}

/** Reads `.coin.commitment` and `.coin.label` (decimal) from a generated note. */
export function noteFields(note: unknown): { commitment: string; label: string; commitmentHex: string } {
  const n = note as { coin?: { commitment?: string; label?: string }; commitment_hex?: string };
  if (!n?.coin?.commitment || !n?.coin?.label || !n?.commitment_hex)
    throw new Error("malformed note: expected { coin: { commitment, label }, commitment_hex }");
  return { commitment: n.coin.commitment, label: n.coin.label, commitmentHex: n.commitment_hex };
}
