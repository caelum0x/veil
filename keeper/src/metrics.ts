// In-process counters / gauges / timers for the keeper.

export class Metrics {
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();

  inc(name: string, by = 1): void {
    this.counters.set(name, (this.counters.get(name) ?? 0) + by);
  }
  count(name: string): number {
    return this.counters.get(name) ?? 0;
  }
  setGauge(name: string, value: number): void {
    this.gauges.set(name, value);
  }
  gauge(name: string): number {
    return this.gauges.get(name) ?? 0;
  }
  async time<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      return await fn();
    } finally {
      this.setGauge(`${name}.ms`, Date.now() - start);
    }
  }
  snapshot(): { counters: Record<string, number>; gauges: Record<string, number> } {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
    };
  }
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
  }
  keys(): string[] {
    return [...this.counters.keys(), ...this.gauges.keys()];
  }
}
