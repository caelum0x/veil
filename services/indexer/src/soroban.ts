import { Buffer } from "buffer";
import {
  rpc,
  TransactionBuilder,
  BASE_FEE,
  Contract,
  Account,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";

globalThis.Buffer = globalThis.Buffer ?? Buffer;

/**
 * Read-only contract reader. Calls a getter via `simulateTransaction` — no signing,
 * no fees, no on-chain effect. The source account only needs a valid format; it is
 * never charged and its sequence is ignored by simulation.
 */
export class SorobanReader {
  private server: rpc.Server;

  constructor(
    rpcUrl: string,
    private networkPassphrase: string,
    private simSource: string,
  ) {
    this.server = new rpc.Server(rpcUrl);
  }

  async call(contractId: string, method: string, args: xdr.ScVal[] = []): Promise<unknown> {
    const source = new Account(this.simSource, "0");
    const tx = new TransactionBuilder(source, {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(new Contract(contractId).call(method, ...args))
      .setTimeout(30)
      .build();

    const sim = await this.server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(sim)) throw new Error(`${method} sim failed: ${sim.error}`);
    if (!("result" in sim) || !sim.result) throw new Error(`${method}: no result`);
    return scValToNative(sim.result.retval);
  }
}
