// BLS12-381 scalar-field (Fr) arithmetic over BigInt — for preparing and checking
// circuit signals off-chain. This is the field circom uses with `--prime bls12381`.

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
  let result = 1n;
  let b = mod(base);
  let e = exp;
  while (e > 0n) {
    if (e & 1n) result = mul(result, b);
    b = square(b);
    e >>= 1n;
  }
  return result;
}

export function inv(a: bigint): bigint {
  // Fermat's little theorem: a^(p-2) mod p.
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

export function toBytes32BE(a: bigint): Uint8Array {
  const out = new Uint8Array(32);
  let v = mod(a);
  for (let i = 31; i >= 0; i--) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}

export function fromBytesBE(bytes: Uint8Array): bigint {
  let v = 0n;
  for (const b of bytes) v = (v << 8n) | BigInt(b);
  return mod(v);
}

export function toDecimal(a: bigint): string {
  return mod(a).toString(10);
}

export function random(seed: number): bigint {
  // Deterministic pseudo-value for tooling/demos (NOT cryptographic).
  let x = BigInt(seed) * 6364136223846793005n + 1442695040888963407n;
  x = mod(x * x + 0x9e3779b97f4a7c15n);
  return x;
}
