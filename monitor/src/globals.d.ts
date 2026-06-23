// Minimal ambient declarations so the monitor typechecks without @types/node.
// At runtime (tsx/node) the real globals/modules are present.
declare const process: { env: Record<string, string | undefined>; on(e: string, cb: () => void): void; exit(code?: number): void };

declare module "node:http" {
  export interface IncomingMessage {
    url?: string;
    method?: string;
  }
  export interface ServerResponse {
    statusCode: number;
    setHeader(key: string, value: string): void;
    end(body?: string): void;
  }
  export interface Server {
    listen(port: number, cb?: () => void): void;
    close(): void;
  }
  export function createServer(
    handler: (req: IncomingMessage, res: ServerResponse) => void,
  ): Server;
}
