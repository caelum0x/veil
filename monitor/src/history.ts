// Rolling sample history for trend lines and uptime calculation.

import type { HealthReport } from "./scoring.ts";

export interface Sample {
  at: number;
  score: number;
  status: string;
  issueCount: number;
}

export class History {
  private samples: Sample[] = [];

  constructor(private capacity: number) {}

  record(report: HealthReport): void {
    this.samples.push({
      at: report.at,
      score: report.score,
      status: report.status,
      issueCount: report.issues.length,
    });
    while (this.samples.length > this.capacity) this.samples.shift();
  }

  all(): Sample[] {
    return this.samples;
  }

  latest(): Sample | undefined {
    return this.samples[this.samples.length - 1];
  }

  size(): number {
    return this.samples.length;
  }

  averageScore(): number {
    if (!this.samples.length) return 0;
    return Math.round(this.samples.reduce((s, x) => s + x.score, 0) / this.samples.length);
  }

  /** Fraction of samples where status was "up". */
  uptime(): number {
    if (!this.samples.length) return 1;
    return this.samples.filter((s) => s.status === "up").length / this.samples.length;
  }

  scoreSeries(): number[] {
    return this.samples.map((s) => s.score);
  }

  /** Compact sparkline of recent scores using block characters. */
  sparkline(width = 40): string {
    const bars = "▁▂▃▄▅▆▇█";
    const series = this.scoreSeries().slice(-width);
    return series.map((v) => bars[Math.min(7, Math.floor((v / 100) * 8))]).join("");
  }
}
