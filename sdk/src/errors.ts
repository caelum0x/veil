// SDK error types.

export class VeilError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VeilError";
  }
}

export class NetworkError extends VeilError {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "NetworkError";
  }
}

export class ValidationError extends VeilError {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends VeilError {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export function isVeilError(e: unknown): e is VeilError {
  return e instanceof VeilError;
}

export function isNetworkError(e: unknown): e is NetworkError {
  return e instanceof NetworkError;
}

export function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function validation(message: string, field?: string): ValidationError {
  return new ValidationError(message, field);
}

export function network(message: string, status?: number): NetworkError {
  return new NetworkError(message, status);
}

export function notFound(message: string): NotFoundError {
  return new NotFoundError(message);
}

export function wrap(e: unknown, context: string): VeilError {
  return new VeilError(`${context}: ${messageOf(e)}`);
}
