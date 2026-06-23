// A tiny periodic task scheduler with overlap protection and per-task stats.

export interface Task {
  name: string;
  intervalMs: number;
  run: () => Promise<void>;
}

export interface TaskStats {
  runs: number;
  failures: number;
  lastRunMs: number;
  lastDurationMs: number;
  lastError?: string;
}

export class Scheduler {
  private timers = new Map<string, ReturnType<typeof setInterval>>();
  private running = new Set<string>();
  private stats = new Map<string, TaskStats>();

  add(task: Task): void {
    this.stats.set(task.name, { runs: 0, failures: 0, lastRunMs: 0, lastDurationMs: 0 });
    const tick = () => void this.runOnce(task);
    this.timers.set(task.name, setInterval(tick, task.intervalMs));
  }

  async runOnce(task: Task): Promise<void> {
    if (this.running.has(task.name)) return; // skip overlap
    this.running.add(task.name);
    const start = Date.now();
    const s = this.stats.get(task.name)!;
    try {
      await task.run();
      s.runs++;
      s.lastError = undefined;
    } catch (e) {
      s.failures++;
      s.lastError = e instanceof Error ? e.message : String(e);
    } finally {
      s.lastRunMs = start;
      s.lastDurationMs = Date.now() - start;
      this.running.delete(task.name);
    }
  }

  async runAllNow(tasks: Task[]): Promise<void> {
    await Promise.all(tasks.map((t) => this.runOnce(t)));
  }

  statsFor(name: string): TaskStats | undefined {
    return this.stats.get(name);
  }

  allStats(): Record<string, TaskStats> {
    return Object.fromEntries(this.stats);
  }

  isRunning(name: string): boolean {
    return this.running.has(name);
  }

  stop(name: string): void {
    const t = this.timers.get(name);
    if (t) clearInterval(t);
    this.timers.delete(name);
  }

  stopAll(): void {
    for (const name of this.timers.keys()) this.stop(name);
  }

  taskNames(): string[] {
    return [...this.timers.keys()];
  }
}
