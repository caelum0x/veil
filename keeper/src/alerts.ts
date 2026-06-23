// Alert rules + sink. Alerts are derived from pool snapshots; the sink just logs
// here, but is the seam where PagerDuty/Slack/webhooks would plug in.

import type { PoolSnapshot } from "../../sdk/src/types.ts";
import * as log from "./log.ts";

export type Severity = "info" | "warn" | "critical";

export interface Alert {
  severity: Severity;
  rule: string;
  message: string;
  denom?: number;
  at: number;
}

export function alert(severity: Severity, rule: string, message: string, denom?: number): Alert {
  return { severity, rule, message, denom, at: Date.now() };
}

export function poolUnreachable(snap: PoolSnapshot): Alert | null {
  return snap.error ? alert("critical", "pool-unreachable", `pool ${snap.denom}: ${snap.error}`, snap.denom) : null;
}

export function poolNearlyFull(snap: PoolSnapshot, fillBps: number, warnBps: number): Alert | null {
  return fillBps >= warnBps
    ? alert("warn", "pool-nearly-full", `pool ${snap.denom} fill ${(fillBps / 100).toFixed(1)}%`, snap.denom)
    : null;
}

export function snapshotStale(snap: PoolSnapshot, staleMs: number): Alert | null {
  const age = Date.now() - snap.lastUpdated;
  return age > staleMs
    ? alert("warn", "snapshot-stale", `pool ${snap.denom} snapshot ${Math.round(age / 1000)}s old`, snap.denom)
    : null;
}

export function dedupe(alerts: Alert[]): Alert[] {
  const seen = new Set<string>();
  return alerts.filter((a) => {
    const key = `${a.rule}:${a.denom ?? ""}`;
    return seen.has(key) ? false : (seen.add(key), true);
  });
}

export function bySeverity(alerts: Alert[], severity: Severity): Alert[] {
  return alerts.filter((a) => a.severity === severity);
}

export function emit(alerts: Alert[]): void {
  for (const a of dedupe(alerts)) {
    const line = `${a.rule}: ${a.message}`;
    if (a.severity === "critical") log.error(`🚨 ${line}`);
    else if (a.severity === "warn") log.warn(`⚠ ${line}`);
    else log.info(line);
  }
}

export function summarize(alerts: Alert[]): string {
  const c = bySeverity(alerts, "critical").length;
  const w = bySeverity(alerts, "warn").length;
  return `${c} critical, ${w} warnings`;
}
