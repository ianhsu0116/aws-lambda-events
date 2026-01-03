export type Headers = Record<string, string>;

export function mergeHeaders(base: Headers | undefined, extra: Headers): Headers {
  return { ...base, ...extra };
}

export function createJsonResponse(body: unknown, statusCode: number, headers?: Headers) {
  return {
    statusCode,
    headers: mergeHeaders(headers, { "content-type": "application/json" }),
    body: JSON.stringify(body),
  };
}

export function createTextResponse(body: string, statusCode: number, headers?: Headers) {
  return {
    statusCode,
    headers: mergeHeaders(headers, { "content-type": "text/plain; charset=utf-8" }),
    body,
  };
}

export function createNoContentResponse(headers?: Headers) {
  return {
    statusCode: 204,
    headers: headers ? { ...headers } : undefined,
    body: "",
  };
}

export function createRedirectResponse(location: string, statusCode: number, headers?: Headers) {
  return {
    statusCode,
    headers: mergeHeaders(headers, { Location: location }),
    body: "",
  };
}
