// Tiny structured logger.

type Level = "debug" | "info" | "warn" | "error";

const LEVELS: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };
let threshold: number = LEVELS[(process.env.LOG_LEVEL as Level) ?? "info"] ?? 1;

export function setLevel(level: Level): void {
  threshold = LEVELS[level];
}

function emit(level: Level, msg: string, meta?: unknown): void {
  if (LEVELS[level] < threshold) return;
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${msg}`;
  const out = level === "error" || level === "warn" ? console.error : console.log;
  if (meta !== undefined) out(line, meta);
  else out(line);
}

export function debug(msg: string, meta?: unknown): void {
  emit("debug", msg, meta);
}
export function info(msg: string, meta?: unknown): void {
  emit("info", msg, meta);
}
export function warn(msg: string, meta?: unknown): void {
  emit("warn", msg, meta);
}
export function error(msg: string, meta?: unknown): void {
  emit("error", msg, meta);
}

export function child(prefix: string) {
  return {
    debug: (m: string, meta?: unknown) => debug(`[${prefix}] ${m}`, meta),
    info: (m: string, meta?: unknown) => info(`[${prefix}] ${m}`, meta),
    warn: (m: string, meta?: unknown) => warn(`[${prefix}] ${m}`, meta),
    error: (m: string, meta?: unknown) => error(`[${prefix}] ${m}`, meta),
  };
}
