// Minimal ambient declarations so examples typecheck without @types/node.
declare const process: { env: Record<string, string | undefined>; argv: string[]; exit(code?: number): void };

declare module "node:fs" {
  export function readFileSync(path: string, encoding: string): string;
}
