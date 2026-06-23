// Retry / backoff / timeout helpers for flaky network calls.

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export interface RetryOptions {
  attempts?: number;
  baseMs?: number;
  maxMs?: number;
  factor?: number;
  onRetry?: (attempt: number, err: unknown) => void;
}

export async function retry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const { attempts = 4, baseMs = 250, maxMs = 5000, factor = 2, onRetry } = opts;
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) {
        onRetry?.(i + 1, e);
        await sleep(backoff(i, baseMs, maxMs, factor));
      }
    }
  }
  throw lastErr;
}

export function backoff(attempt: number, baseMs: number, maxMs: number, factor: number): number {
  return Math.min(maxMs, baseMs * factor ** attempt);
}

export function timeout<T>(promise: Promise<T>, ms: number, label = "operation"): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)),
  ]);
}

export async function pollUntil<T>(
  fn: () => Promise<T | null>,
  opts: { intervalMs?: number; maxAttempts?: number } = {},
): Promise<T | null> {
  const { intervalMs = 1000, maxAttempts = 30 } = opts;
  for (let i = 0; i < maxAttempts; i++) {
    const v = await fn();
    if (v !== null) return v;
    await sleep(intervalMs);
  }
  return null;
}
