// Minimal ambient declarations so the keeper typechecks without @types/node.
// At runtime (tsx/node) the real globals are present.
declare const process: { env: Record<string, string | undefined>; on(event: string, cb: () => void): void; exit(code?: number): void };
