import express, { type Request, type Response } from "express";
import cors from "cors";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import type { RelayerConfig, Pool } from "./config.js";
import { run } from "./exec.js";
import { StateStore } from "./state.js";
import { Asp } from "./asp.js";
import { Prover, noteFields } from "./prover.js";

export function createServer(cfg: RelayerConfig) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  const state = new StateStore(cfg.network, cfg.paths.work);
  const asp = new Asp(cfg);
  const prover = new Prover(cfg, state);

  let counter = 0;
  const nextId = () => `req-${Date.now()}-${counter++}`;

  const poolByDenom = (denom: unknown): Pool | undefined =>
    cfg.manifest.pools.find((p) => p.denom === Number(denom));

  const fail = (res: Response, code: number, message: string) =>
    res.status(code).json({ error: message });

  // Wrap async handlers so rejections become 500s instead of crashing the process.
  const h =
    (fn: (req: Request, res: Response) => Promise<void>) =>
    (req: Request, res: Response) =>
      fn(req, res).catch((e: unknown) => {
        const message = e instanceof Error ? e.message : String(e);
        console.error("[relayer]", message);
        if (!res.headersSent) fail(res, 500, message);
      });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, network: cfg.network, pools: cfg.manifest.pools.length });
  });

  app.get("/api/pools", (_req, res) => {
    res.json({
      network: cfg.manifest.network,
      token: cfg.manifest.token,
      pools: cfg.manifest.pools.map((p) => ({
        contractId: p.contractId,
        denom: p.denom,
        scope: p.scope,
      })),
    });
  });

  // Mint a fresh coin (commitment + secret note) for a pool.
  app.post(
    "/api/notes",
    h(async (req, res) => {
      const pool = poolByDenom(req.body?.denom);
      if (!pool) return void fail(res, 400, "unknown denom");

      const id = nextId();
      const work = resolve(cfg.paths.work, id);
      mkdirSync(work, { recursive: true });
      const out = resolve(work, "coin.json");
      try {
        await run(cfg.paths.coinutils, [
          "generate",
          pool.scope,
          "-o",
          out,
          "--value",
          String(pool.denom),
        ]);
        const note = JSON.parse(readFileSync(out, "utf8"));
        const { commitmentHex } = noteFields(note);
        res.json({ note, commitmentHex, denom: pool.denom, contractId: pool.contractId, scope: pool.scope });
      } finally {
        rmSync(work, { recursive: true, force: true });
      }
    }),
  );

  // Called by the frontend after a deposit tx confirms: record the commitment and
  // publish the updated association root so the coin becomes withdrawable.
  app.post(
    "/api/deposits/confirm",
    h(async (req, res) => {
      const pool = poolByDenom(req.body?.denom);
      if (!pool) return void fail(res, 400, "unknown denom");
      const note = req.body?.note;
      if (!note) return void fail(res, 400, "missing note");

      const { commitment, label } = noteFields(note);
      const leafCount = state.addCommitment(pool.scope, commitment);
      const root = await asp.addLabel(label, state.associationFile(pool.scope));
      await asp.setRootOnChain(pool.contractId, root);
      res.json({ leafCount, associationRoot: root });
    }),
  );

  // Generate a withdrawal proof for a coin against current pool state.
  app.post(
    "/api/withdraw",
    h(async (req, res) => {
      const pool = poolByDenom(req.body?.denom);
      if (!pool) return void fail(res, 400, "unknown denom");
      const note = req.body?.note;
      const recipient = req.body?.recipient;
      if (!note) return void fail(res, 400, "missing note");
      if (typeof recipient !== "string" || !recipient.startsWith("G"))
        return void fail(res, 400, "invalid recipient (expected a Stellar G... address)");

      const id = nextId();
      try {
        const proof = await prover.prove(pool.scope, note, id);
        res.json({ ...proof, contractId: pool.contractId, denom: pool.denom, recipient });
      } finally {
        rmSync(resolve(cfg.paths.work, id), { recursive: true, force: true });
      }
    }),
  );

  return app;
}
