// Error helpers and typed HTTP errors.

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function badRequest(message: string): HttpError {
  return new HttpError(400, message);
}
export function notFound(message: string): HttpError {
  return new HttpError(404, message);
}
export function serverError(message: string): HttpError {
  return new HttpError(500, message);
}

export function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function statusOf(e: unknown): number {
  return e instanceof HttpError ? e.status : 500;
}

export function isHttpError(e: unknown): e is HttpError {
  return e instanceof HttpError;
}

export function toErrorBody(e: unknown): { error: string } {
  return { error: messageOf(e) };
}
