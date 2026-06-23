import express from "express";
import cors from "cors";
import type { IndexerConfig } from "./config.js";
import type { SnapshotStore } from "./store.js";

export function createServer(cfg: IndexerConfig, store: SnapshotStore) {
  const app = express();
  app.use(cors());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, network: cfg.manifest.network, pools: cfg.manifest.pools.length });
  });

  // Aggregate dashboard stats across every pool.
  app.get("/api/stats", (_req, res) => {
    res.json({ ...store.totals(), pools: store.all() });
  });

  // Per-pool snapshot by denomination.
  app.get("/api/pools/:denom", (req, res) => {
    const snap = store.get(Number(req.params.denom));
    if (!snap) return void res.status(404).json({ error: "unknown denom" });
    res.json(snap);
  });

  return app;
}
