// BLS12-381 scalar-field arithmetic over BigInt (matches the circuits' Fr).

export const FR_MODULUS =
  0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001n;

export function mod(a: bigint): bigint {
  const r = a % FR_MODULUS;
  return r >= 0n ? r : r + FR_MODULUS;
}
export function add(a: bigint, b: bigint): bigint {
  return mod(a + b);
}
export function sub(a: bigint, b: bigint): bigint {
  return mod(a - b);
}
export function mul(a: bigint, b: bigint): bigint {
  return mod(a * b);
}
export function neg(a: bigint): bigint {
  return mod(-a);
}
export function square(a: bigint): bigint {
  return mod(a * a);
}
export function pow(base: bigint, exp: bigint): bigint {
  let r = 1n;
  let b = mod(base);
  let e = exp;
  while (e > 0n) {
    if (e & 1n) r = mul(r, b);
    b = square(b);
    e >>= 1n;
  }
  return r;
}
export function inv(a: bigint): bigint {
  return pow(a, FR_MODULUS - 2n);
}
export function div(a: bigint, b: bigint): bigint {
  return mul(a, inv(b));
}
export function isZero(a: bigint): boolean {
  return mod(a) === 0n;
}
export function eq(a: bigint, b: bigint): boolean {
  return mod(a) === mod(b);
}
export function inField(a: bigint): boolean {
  return a >= 0n && a < FR_MODULUS;
}
export function fromHex(hex: string): bigint {
  return mod(BigInt(hex.startsWith("0x") ? hex : `0x${hex}`));
}
export function toHex32(a: bigint): string {
  return mod(a).toString(16).padStart(64, "0");
}
export function toDecimal(a: bigint): string {
  return mod(a).toString(10);
}
export function fitsBits(v: bigint, bits: number): boolean {
  return v >= 0n && v < 1n << BigInt(bits);
}
export function fits128(v: bigint): boolean {
  return fitsBits(v, 128);
}
