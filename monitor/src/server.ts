// HTTP surface: dashboard (/), Prometheus (/metrics), JSON (/health, /api/state).

import { createServer, type Server } from "node:http";
import type { HealthReport } from "./scoring.ts";
import type { History } from "./history.ts";
import type { IndexerStats } from "../../sdk/src/types.ts";
import { renderDashboard, renderMetrics } from "./dashboard.ts";

export interface MonitorState {
  report: HealthReport;
  stats: IndexerStats | null;
}

export function createMonitorServer(getState: () => MonitorState | null, history: History): Server {
  return createServer((req, res) => {
    const url = req.url ?? "/";
    const state = getState();

    if (url === "/health") {
      const ok = !!state && state.report.status !== "down";
      res.statusCode = ok ? 200 : 503;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ ok, status: state?.report.status ?? "unknown", score: state?.report.score ?? 0 }));
      return;
    }

    if (url === "/metrics") {
      res.statusCode = 200;
      res.setHeader("content-type", "text/plain; version=0.0.4");
      res.end(state ? renderMetrics(state.report, state.stats) : "# no data\n");
      return;
    }

    if (url === "/api/state") {
      res.statusCode = 200;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ ...state, history: history.all(), uptime: history.uptime() }));
      return;
    }

    if (url === "/" || url === "/index.html") {
      res.statusCode = 200;
      res.setHeader("content-type", "text/html; charset=utf-8");
      res.end(state ? renderDashboard(state.report, state.stats, history) : "<p>warming up…</p>");
      return;
    }

    res.statusCode = 404;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "not found" }));
  });
}
