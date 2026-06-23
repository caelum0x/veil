// Typed client for the Veil relayer / ASP coordinator API.

import type { Note, PoolsResponse, MintResult, ConfirmResult, WithdrawalProof } from "./types.ts";
import { getJson, postJson, type HttpOptions } from "./http.ts";
import { ValidationError } from "./errors.ts";
import { isAccount } from "./strkey.ts";

export class RelayerClient {
  constructor(
    private baseUrl: string,
    private http: HttpOptions = {},
  ) {}

  url(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  async health(): Promise<{ ok: boolean; network: string; pools: number }> {
    return getJson(this.url("/api/health"), this.http);
  }

  async pools(): Promise<PoolsResponse> {
    return getJson(this.url("/api/pools"), this.http);
  }

  async mintNote(denom: number): Promise<MintResult> {
    return postJson(this.url("/api/notes"), { denom }, this.http);
  }

  async confirmDeposit(denom: number, note: Note): Promise<ConfirmResult> {
    return postJson(this.url("/api/deposits/confirm"), { denom, note }, this.http);
  }

  async requestWithdrawalProof(denom: number, note: Note, recipient: string): Promise<WithdrawalProof> {
    if (!isAccount(recipient)) throw new ValidationError("invalid recipient address", "recipient");
    return postJson(this.url("/api/withdraw"), { denom, note, recipient }, this.http);
  }

  async isUp(): Promise<boolean> {
    try {
      await this.health();
      return true;
    } catch {
      return false;
    }
  }
}
