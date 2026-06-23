// Renders the live dashboard HTML + Prometheus metrics from current state.

import type { HealthReport } from "./scoring.ts";
import { statusEmoji, fillBps } from "./scoring.ts";
import type { History } from "./history.ts";
import type { IndexerStats } from "../../sdk/src/types.ts";

export function renderMetrics(report: HealthReport, stats: IndexerStats | null): string {
  const lines: string[] = [];
  lines.push("# HELP veil_health_score Overall health score 0-100");
  lines.push("# TYPE veil_health_score gauge");
  lines.push(`veil_health_score ${report.score}`);
  lines.push("# HELP veil_up Per-probe up status (1=up)");
  lines.push("# TYPE veil_up gauge");
  for (const p of report.probes) lines.push(`veil_up{probe="${p.name}"} ${p.status === "up" ? 1 : 0}`);
  lines.push("# HELP veil_probe_latency_ms Probe latency");
  lines.push("# TYPE veil_probe_latency_ms gauge");
  for (const p of report.probes) lines.push(`veil_probe_latency_ms{probe="${p.name}"} ${p.latencyMs}`);
  if (stats) {
    lines.push("# HELP veil_pool_deposits Deposits per pool");
    lines.push("# TYPE veil_pool_deposits gauge");
    for (const s of stats.pools) lines.push(`veil_pool_deposits{denom="${s.denom}"} ${s.commitmentCount}`);
    lines.push(`veil_total_locked ${stats.totalLocked}`);
  }
  return lines.join("\n") + "\n";
}

function poolRows(stats: IndexerStats | null): string {
  if (!stats) return `<tr><td colspan="4">no data</td></tr>`;
  return stats.pools
    .map(
      (s) =>
        `<tr><td>${s.denom / 1e9} XLM</td><td>${s.commitmentCount}</td><td>${s.nullifierCount}</td><td>${(fillBps(s) / 100).toFixed(2)}%</td></tr>`,
    )
    .join("");
}

export function renderDashboard(report: HealthReport, stats: IndexerStats | null, history: History): string {
  const issues = report.issues.length
    ? report.issues.map((i) => `<li>${i}</li>`).join("")
    : "<li>none</li>";
  return `<!doctype html><html><head><meta charset="utf-8"><title>Veil monitor</title>
<meta http-equiv="refresh" content="15">
<style>body{font:14px system-ui;background:#0b0d12;color:#e7e9ee;max-width:760px;margin:30px auto;padding:0 16px}
h1{font-size:20px}.score{font-size:48px;font-weight:700}.spark{font-family:monospace;color:#28e0b0;letter-spacing:1px}
table{width:100%;border-collapse:collapse;margin-top:12px}td,th{padding:8px;border-bottom:1px solid #262b3a;text-align:left}
.muted{color:#8b91a3}.issues li{color:#ffce73}</style></head><body>
<h1>${statusEmoji(report.status)} Veil monitor — ${report.status.toUpperCase()}</h1>
<div class="score">${report.score}<span class="muted" style="font-size:18px">/100</span></div>
<div class="spark">${history.sparkline()}</div>
<p class="muted">uptime ${(history.uptime() * 100).toFixed(1)}% over ${history.size()} samples · avg ${history.averageScore()}</p>
<h3>Probes</h3>
<table><tr><th>Probe</th><th>Status</th><th>Latency</th></tr>
${report.probes.map((p) => `<tr><td>${p.name}</td><td>${statusEmoji(p.status as never)} ${p.status}</td><td>${p.latencyMs}ms</td></tr>`).join("")}
</table>
<h3>Pools</h3>
<table><tr><th>Denom</th><th>Deposits</th><th>Withdrawals</th><th>Fill</th></tr>${poolRows(stats)}</table>
<h3>Issues</h3><ul class="issues">${issues}</ul>
</body></html>`;
}
