// Keeper logger.

type Level = "debug" | "info" | "warn" | "error";
const LEVELS: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };
let threshold = 1;

export function setLevel(level: Level): void {
  threshold = LEVELS[level];
}
function emit(level: Level, msg: string, meta?: unknown): void {
  if (LEVELS[level] < threshold) return;
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${msg}`;
  if (meta !== undefined) console.log(line, meta);
  else console.log(line);
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
export function task(name: string) {
  return {
    info: (m: string, meta?: unknown) => info(`[${name}] ${m}`, meta),
    warn: (m: string, meta?: unknown) => warn(`[${name}] ${m}`, meta),
    error: (m: string, meta?: unknown) => error(`[${name}] ${m}`, meta),
  };
}
