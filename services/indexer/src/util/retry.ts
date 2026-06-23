// Retry/timeout helpers for the indexer's RPC polling.

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function retry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 300): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) await sleep(baseMs * 2 ** i);
    }
  }
  throw lastErr;
}

export function timeout<T>(p: Promise<T>, ms: number, label = "rpc"): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`${label} timed out after ${ms}ms`)), ms)),
  ]);
}

export async function settleAll<T>(ps: Promise<T>[]): Promise<(T | null)[]> {
  const results = await Promise.allSettled(ps);
  return results.map((r) => (r.status === "fulfilled" ? r.value : null));
}

export function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  return fn().catch(() => fallback);
}
