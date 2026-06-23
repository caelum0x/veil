/** Format stroops as XLM with thin separators. */
export function xlm(stroops: number | string): string {
  return (Number(stroops) / 1e9).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

/** Shorten a Stellar address for display: GABC12…XYZ789. */
export function shortAddr(a: string | null | undefined): string {
  return a ? `${a.slice(0, 6)}…${a.slice(-6)}` : "";
}

/** Shorten a hex string / tx hash. */
export function shortHex(h: string | null | undefined, head = 10): string {
  return h ? `${h.slice(0, head)}…` : "";
}
