export const REQUEST_ID_HEADER = "x-request-id";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidRequestId(value: string): boolean {
  return UUID_RE.test(value);
}

export function createRequestId(): string {
  return globalThis.crypto.randomUUID();
}

export function getResponseRequestId(response: Response): string | null {
  return response.headers.get(REQUEST_ID_HEADER);
}
