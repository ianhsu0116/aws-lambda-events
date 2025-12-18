import type { APIGatewayProxyResult as ProxyResultV1 } from "aws-lambda";

type Headers = Record<string, string>;

function mergeHeaders(base: Headers | undefined, extra: Headers): Headers {
  return { ...(base ?? {}), ...extra };
}

export class Response {
  static json(body: unknown, statusCode = 200, headers?: Headers): ProxyResultV1 {
    return {
      statusCode,
      headers: mergeHeaders(headers, { "content-type": "application/json" }),
      body: JSON.stringify(body),
    };
  }

  static text(body: string, statusCode = 200, headers?: Headers): ProxyResultV1 {
    return {
      statusCode,
      headers: mergeHeaders(headers, { "content-type": "text/plain; charset=utf-8" }),
      body,
    };
  }

  static noContent(headers?: Headers): ProxyResultV1 {
    return {
      statusCode: 204,
      headers: headers ? { ...headers } : undefined,
      body: "",
    };
  }

  static redirect(location: string, statusCode = 302, headers?: Headers): ProxyResultV1 {
    return {
      statusCode,
      headers: mergeHeaders(headers, { Location: location }),
      body: "",
    };
  }
}
