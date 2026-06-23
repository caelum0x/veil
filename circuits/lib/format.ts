// Conversions between the representations circom/snarkjs and Soroban use for signals.

export function decToHex(dec: string): string {
  return BigInt(dec).toString(16).padStart(64, "0");
}
export function hexToDec(hex: string): string {
  return BigInt(hex.startsWith("0x") ? hex : `0x${hex}`).toString(10);
}
export function strip0x(s: string): string {
  return s.replace(/^0x/i, "");
}
export function ensure0x(s: string): string {
  return /^0x/i.test(s) ? s : `0x${s}`;
}
export function padHex32(hex: string): string {
  return strip0x(hex).padStart(64, "0");
}
export function decToBytesBE(dec: string): Uint8Array {
  const out = new Uint8Array(32);
  let v = BigInt(dec);
  for (let i = 31; i >= 0; i--) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}
export function bytesToHex(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return s;
}
export function hexToBytes(hex: string): Uint8Array {
  const h = strip0x(hex);
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}
export function stroopsToField(stroops: bigint): bigint {
  return stroops; // amounts are small positives, already valid field elements
}
export function amountToHex32(stroops: bigint): string {
  return stroops.toString(16).padStart(64, "0");
}
export function reverseHexBytes(hex: string): string {
  return bytesToHex(hexToBytes(hex).reverse());
}
export function isDecimal(s: string): boolean {
  return /^[0-9]+$/.test(s);
}
export function isHex(s: string): boolean {
  return /^[0-9a-f]+$/i.test(strip0x(s));
}
export function shortHex(s: string, head = 10): string {
  const h = ensure0x(strip0x(s));
  return h.length > head ? `${h.slice(0, head)}…` : h;
}
export function decArray(values: bigint[]): string[] {
  return values.map((v) => v.toString(10));
}
export function hexArray(values: bigint[]): string[] {
  return values.map((v) => v.toString(16).padStart(64, "0"));
}
