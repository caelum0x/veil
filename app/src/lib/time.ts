// Time / relative-time formatting helpers.

export function now(): number {
  return Date.now();
}

export function secondsAgo(ts: number): number {
  return Math.floor((Date.now() - ts) / 1000);
}

export function relative(ts: number): string {
  const s = secondsAgo(ts);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function isStale(ts: number, maxAgeMs: number): boolean {
  return Date.now() - ts > maxAgeMs;
}

export function formatClock(ts: number): string {
  return new Date(ts).toLocaleTimeString();
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString();
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString();
}

export function iso(ts: number): string {
  return new Date(ts).toISOString();
}

export function durationLabel(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
