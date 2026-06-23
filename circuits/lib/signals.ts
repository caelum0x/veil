// Helpers for the Withdraw circuit's public-signal vector.
// snarkjs order: [ nullifierHash, withdrawnValue, stateRoot, associationRoot ].

export const SIGNAL_NAMES = ["nullifierHash", "withdrawnValue", "stateRoot", "associationRoot"] as const;
export type SignalName = (typeof SIGNAL_NAMES)[number];

export interface PublicSignals {
  nullifierHash: bigint;
  withdrawnValue: bigint;
  stateRoot: bigint;
  associationRoot: bigint;
}

export function fromArray(signals: (string | bigint)[]): PublicSignals {
  if (signals.length < 4) throw new Error(`expected >=4 public signals, got ${signals.length}`);
  return {
    nullifierHash: BigInt(signals[0]),
    withdrawnValue: BigInt(signals[1]),
    stateRoot: BigInt(signals[2]),
    associationRoot: BigInt(signals[3]),
  };
}

export function toArray(s: PublicSignals): string[] {
  return [s.nullifierHash, s.withdrawnValue, s.stateRoot, s.associationRoot].map((v) => v.toString(10));
}

export function indexOf(name: SignalName): number {
  return SIGNAL_NAMES.indexOf(name);
}

export function nameOf(index: number): SignalName | undefined {
  return SIGNAL_NAMES[index];
}

export function getSignal(signals: (string | bigint)[], name: SignalName): bigint {
  return BigInt(signals[indexOf(name)]);
}

export function nullifierHash(signals: (string | bigint)[]): bigint {
  return getSignal(signals, "nullifierHash");
}

export function withdrawnValue(signals: (string | bigint)[]): bigint {
  return getSignal(signals, "withdrawnValue");
}

export function stateRoot(signals: (string | bigint)[]): bigint {
  return getSignal(signals, "stateRoot");
}

export function associationRoot(signals: (string | bigint)[]): bigint {
  return getSignal(signals, "associationRoot");
}

export function matchesDenom(signals: (string | bigint)[], denomStroops: bigint): boolean {
  return withdrawnValue(signals) === denomStroops;
}

export function toHexSignals(s: PublicSignals): string[] {
  return toArray(s).map((d) => BigInt(d).toString(16).padStart(64, "0"));
}

export function count(): number {
  return SIGNAL_NAMES.length;
}

export function describe(s: PublicSignals): string {
  return SIGNAL_NAMES.map((n) => `${n}=${s[n].toString()}`).join(" ");
}

export function equal(a: PublicSignals, b: PublicSignals): boolean {
  return (
    a.nullifierHash === b.nullifierHash &&
    a.withdrawnValue === b.withdrawnValue &&
    a.stateRoot === b.stateRoot &&
    a.associationRoot === b.associationRoot
  );
}
