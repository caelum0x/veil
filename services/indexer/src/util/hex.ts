// Hex helpers for the indexer.

export function strip0x(s: string): string {
  return s.replace(/^0x/i, "");
}
export function ensure0x(s: string): string {
  return /^0x/i.test(s) ? s : `0x${s}`;
}
export function isHex32(s: string): boolean {
  return /^[0-9a-f]{64}$/i.test(strip0x(s));
}
export function bytesToHex(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return s;
}
export function hexToDecimal(hex: string): string {
  return BigInt(ensure0x(strip0x(hex))).toString(10);
}
export function decimalToHex(dec: string): string {
  return BigInt(dec).toString(16).padStart(64, "0");
}
export function equalHex(a: string, b: string): boolean {
  return strip0x(a).toLowerCase() === strip0x(b).toLowerCase();
}
export function shortHex(s: string, head = 12): string {
  return s && s.length > head ? `${s.slice(0, head)}…` : s;
}
