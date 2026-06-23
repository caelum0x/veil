// Hex helpers (Node/relayer side).

export function strip0x(s: string): string {
  return s.replace(/^0x/i, "");
}
export function ensure0x(s: string): string {
  return /^0x/i.test(s) ? s : `0x${s}`;
}
export function isHex(s: string): boolean {
  const h = strip0x(s);
  return h.length > 0 && /^[0-9a-f]+$/i.test(h);
}
export function isHex32(s: string): boolean {
  return /^[0-9a-f]{64}$/i.test(strip0x(s));
}
export function padLeft(s: string, width: number): string {
  return strip0x(s).padStart(width, "0");
}
export function toHex32(s: string): string {
  const h = strip0x(s);
  return h.length >= 64 ? h.slice(-64) : padLeft(h, 64);
}
export function decimalToHex32(dec: string): string {
  return toHex32(BigInt(dec).toString(16));
}
export function hexToDecimal(hex: string): string {
  return BigInt(ensure0x(strip0x(hex))).toString(10);
}
export function byteLen(s: string): number {
  return Math.floor(strip0x(s).length / 2);
}
export function equalHex(a: string, b: string): boolean {
  return strip0x(a).toLowerCase() === strip0x(b).toLowerCase();
}
export function shortHex(s: string, head = 10): string {
  const h = ensure0x(strip0x(s));
  return h.length > head ? `${h.slice(0, head)}…` : h;
}
