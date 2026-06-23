import { NetworkError } from "./errors.ts";

export interface HttpOptions {
  timeoutMs?: number;
  retries?: number;
  baseDelayMs?: number;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function backoff(attempt: number, baseMs: number): number {
  return Math.min(8000, baseMs * 2 ** attempt);
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await p;
  } finally {
    clearTimeout(t);
  }
}

export async function getJson<T>(url: string, opts: HttpOptions = {}): Promise<T> {
  return request<T>(url, { method: "GET" }, opts);
}

export async function postJson<T>(url: string, body: unknown, opts: HttpOptions = {}): Promise<T> {
  return request<T>(
    url,
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
    opts,
  );
}

export async function request<T>(url: string, init: RequestInit, opts: HttpOptions = {}): Promise<T> {
  const { timeoutMs = 30000, retries = 2, baseDelayMs = 300 } = opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await withTimeout(fetch(url, init), timeoutMs);
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      if (!res.ok) throw new NetworkError(json?.error ?? `HTTP ${res.status}`, res.status);
      return json as T;
    } catch (e) {
      lastErr = e;
      if (attempt < retries) await sleep(backoff(attempt, baseDelayMs));
    }
  }
  throw lastErr instanceof NetworkError ? lastErr : new NetworkError(String(lastErr));
}

export function isReachableStatus(status: number): boolean {
  return status >= 200 && status < 500;
}
