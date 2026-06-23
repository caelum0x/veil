// Veil keeper entry point.

import { fromEnv, validate, describe } from "./config.ts";
import { Scheduler } from "./scheduler.ts";
import { Metrics } from "./metrics.ts";
import { Chain } from "./chain.ts";
import { allTasks } from "./tasks.ts";
import * as log from "./log.ts";

async function main(): Promise<void> {
  const cfg = fromEnv();
  const errs = validate(cfg);
  if (errs.length) {
    log.error(`invalid config: ${errs.join("; ")}`);
    process.exit(1);
  }
  log.info(`▸ Veil keeper starting — ${describe(cfg)}`);

  const metrics = new Metrics();
  const chain = new Chain(cfg);
  const scheduler = new Scheduler();
  const tasks = allTasks(cfg, chain, metrics);

  // Run once immediately, then schedule.
  await scheduler.runAllNow(tasks);
  for (const t of tasks) scheduler.add(t);
  log.info(`scheduled tasks: ${scheduler.taskNames().join(", ")}`);

  process.on("SIGINT", () => {
    scheduler.stopAll();
    log.info("keeper stopped");
    process.exit(0);
  });
}

void main();
