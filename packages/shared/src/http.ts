export const REQUEST_ID_HEADER = "x-request-id";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export const isValidRequestId = (value: string): boolean => UUID_RE.test(value);

export const createRequestId = (): string => globalThis.crypto.randomUUID();

export const getResponseRequestId = (response: Response): string | null =>
  response.headers.get(REQUEST_ID_HEADER);
