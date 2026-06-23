// Health scoring — turns probe results + pool snapshots into a 0..100 score and an
// overall status, plus human-readable issues.

import type { ProbeResult, ProbeStatus } from "./probes.ts";
import type { IndexerStats, PoolSnapshot } from "../../sdk/src/types.ts";

const TREE_DEPTH = 20;

export interface HealthReport {
  score: number;
  status: ProbeStatus;
  issues: string[];
  probes: ProbeResult[];
  at: number;
}

export function fillBps(snap: PoolSnapshot): number {
  return Math.floor((snap.commitmentCount / 2 ** TREE_DEPTH) * 10_000);
}

function statusWeight(s: ProbeStatus): number {
  return s === "up" ? 1 : s === "degraded" ? 0.5 : 0;
}

export function worst(a: ProbeStatus, b: ProbeStatus): ProbeStatus {
  const order: ProbeStatus[] = ["up", "degraded", "down"];
  return order[Math.max(order.indexOf(a), order.indexOf(b))];
}

export function scoreProbes(probes: ProbeResult[]): number {
  if (!probes.length) return 0;
  const avg = probes.reduce((s, p) => s + statusWeight(p.status), 0) / probes.length;
  return Math.round(avg * 100);
}

export function buildReport(
  probes: ProbeResult[],
  stats: IndexerStats | null,
  fillWarnBps: number,
): HealthReport {
  const issues: string[] = [];
  let status: ProbeStatus = "up";

  for (const p of probes) {
    if (p.status !== "up") {
      status = worst(status, p.status);
      issues.push(`${p.name} ${p.status}${p.detail ? `: ${p.detail}` : ""}`);
    }
    if (p.latencyMs > 5000) issues.push(`${p.name} slow (${p.latencyMs}ms)`);
  }

  if (stats) {
    for (const snap of stats.pools) {
      const fill = fillBps(snap);
      if (fill >= fillWarnBps) {
        status = worst(status, "degraded");
        issues.push(`pool ${snap.denom} ${(fill / 100).toFixed(1)}% full`);
      }
    }
  }

  let score = scoreProbes(probes);
  if (issues.length && status === "up") status = "degraded";
  if (status === "degraded") score = Math.min(score, 75);
  if (status === "down") score = Math.min(score, 40);

  return { score, status, issues, probes, at: Date.now() };
}

export function statusEmoji(status: ProbeStatus): string {
  return status === "up" ? "🟢" : status === "degraded" ? "🟡" : "🔴";
}
