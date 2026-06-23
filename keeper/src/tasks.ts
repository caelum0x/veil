// Keeper task builders. Each returns a Task the Scheduler runs on an interval.

import type { Task } from "./scheduler.ts";
import type { KeeperConfig } from "./config.ts";
import type { Chain } from "./chain.ts";
import type { Metrics } from "./metrics.ts";
import * as alerts from "./alerts.ts";
import * as log from "./log.ts";

/** Reachability probe for the relayer + indexer. */
export function healthTask(cfg: KeeperConfig, chain: Chain, metrics: Metrics): Task {
  return {
    name: "health",
    intervalMs: cfg.intervalMs,
    run: async () => {
      const r = await chain.reachable();
      metrics.setGauge("health.relayer", r.relayer ? 1 : 0);
      metrics.setGauge("health.indexer", r.indexer ? 1 : 0);
      if (!r.relayer) alerts.emit([alerts.alert("critical", "relayer-down", "relayer unreachable")]);
      if (!r.indexer) alerts.emit([alerts.alert("critical", "indexer-down", "indexer unreachable")]);
    },
  };
}

/** Watches pool fill levels and raises alerts as pools approach capacity. */
export function fillMonitorTask(cfg: KeeperConfig, chain: Chain, metrics: Metrics): Task {
  return {
    name: "fill-monitor",
    intervalMs: cfg.intervalMs,
    run: async () => {
      const snaps = await chain.snapshots();
      const found: alerts.Alert[] = [];
      for (const s of snaps) {
        const fill = chain.fillBps(s);
        metrics.setGauge(`fill.${s.denom}`, fill);
        const a = alerts.poolNearlyFull(s, fill, cfg.fillWarnBps);
        if (a) found.push(a);
      }
      metrics.inc("fill-monitor.runs");
      if (found.length) alerts.emit(found);
    },
  };
}

/** Flags stale snapshots (indexer not updating) + unhealthy pools. */
export function staleMonitorTask(cfg: KeeperConfig, chain: Chain, metrics: Metrics): Task {
  return {
    name: "stale-monitor",
    intervalMs: cfg.intervalMs,
    run: async () => {
      const snaps = await chain.snapshots();
      const found: alerts.Alert[] = [];
      for (const s of snaps) {
        const stale = alerts.snapshotStale(s, cfg.rootStaleMs);
        const unreachable = alerts.poolUnreachable(s);
        if (stale) found.push(stale);
        if (unreachable) found.push(unreachable);
      }
      metrics.setGauge("stale.count", found.length);
      if (found.length) alerts.emit(found);
    },
  };
}

/** Periodically logs aggregate stats — a heartbeat for operators. */
export function heartbeatTask(cfg: KeeperConfig, chain: Chain, metrics: Metrics): Task {
  return {
    name: "heartbeat",
    intervalMs: cfg.intervalMs * 4,
    run: async () => {
      const stats = await chain.stats();
      metrics.setGauge("total.deposits", stats.totalCommitments);
      metrics.setGauge("total.withdrawals", stats.totalWithdrawals);
      log.info(
        `heartbeat: ${stats.totalCommitments} deposits, ${stats.totalWithdrawals} withdrawals, ${stats.pools.length} pools`,
      );
    },
  };
}

export function allTasks(cfg: KeeperConfig, chain: Chain, metrics: Metrics): Task[] {
  return [
    healthTask(cfg, chain, metrics),
    fillMonitorTask(cfg, chain, metrics),
    staleMonitorTask(cfg, chain, metrics),
    heartbeatTask(cfg, chain, metrics),
  ];
}
