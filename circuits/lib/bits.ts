// Bit / BigInt helpers used when preparing range-checked circuit inputs
// (the Withdraw circuit range-proves withdrawnValue and remainingValue to 128 bits).

export function bit(v: bigint, i: number): number {
  return Number((v >> BigInt(i)) & 1n);
}
export function setBit(v: bigint, i: number): bigint {
  return v | (1n << BigInt(i));
}
export function clearBit(v: bigint, i: number): bigint {
  return v & ~(1n << BigInt(i));
}
export function toBits(v: bigint, width: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < width; i++) out.push(bit(v, i));
  return out;
}
export function fromBits(bits: number[]): bigint {
  let v = 0n;
  for (let i = 0; i < bits.length; i++) if (bits[i]) v |= 1n << BigInt(i);
  return v;
}
export function bitLength(v: bigint): number {
  return v <= 0n ? 0 : v.toString(2).length;
}
export function fitsBits(v: bigint, width: number): boolean {
  return v >= 0n && v < 1n << BigInt(width);
}
export function fits128(v: bigint): boolean {
  return fitsBits(v, 128);
}
export function lowMask(bits: number): bigint {
  return (1n << BigInt(bits)) - 1n;
}
export function low(v: bigint, bits: number): bigint {
  return v & lowMask(bits);
}
export function high(v: bigint, bits: number): bigint {
  return v >> BigInt(bits);
}
export function popcount(v: bigint): number {
  let n = 0;
  let x = v;
  while (x > 0n) {
    n += Number(x & 1n);
    x >>= 1n;
  }
  return n;
}
export function isPow2(v: bigint): boolean {
  return v > 0n && (v & (v - 1n)) === 0n;
}
export function nextPow2(v: bigint): bigint {
  let p = 1n;
  while (p < v) p <<= 1n;
  return p;
}
export function reverseBits(v: bigint, width: number): bigint {
  let r = 0n;
  for (let i = 0; i < width; i++) if (bit(v, i)) r |= 1n << BigInt(width - 1 - i);
  return r;
}
export function toBytesLE(v: bigint, len: number): number[] {
  const out: number[] = [];
  let x = v;
  for (let i = 0; i < len; i++) {
    out.push(Number(x & 0xffn));
    x >>= 8n;
  }
  return out;
}
export function rangeCheck128(value: bigint, withdrawn: bigint): boolean {
  return fits128(withdrawn) && fits128(value - withdrawn) && withdrawn <= value;
}
