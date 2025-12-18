import { BaseRequest } from "../core/request.js";
import { UnsupportedEventError } from "../core/errors.js";
import { detectEventKind } from "./detect.js";
import type { ProxyEventV1, ProxyEventV1WithCognitoAuthorizer } from "../core/types.js";

export class RestApiRequest extends BaseRequest<ProxyEventV1 | ProxyEventV1WithCognitoAuthorizer> {
  constructor(event: ProxyEventV1 | ProxyEventV1WithCognitoAuthorizer) {
    super(event);
    const kind = detectEventKind(event);
    if (kind !== "v1") {
      throw new UnsupportedEventError("Expected payload v1.0 event");
    }
  }

  getPathParam(key: string, defaultValue?: string): string | undefined {
    const params = this.event.pathParameters ?? {};
    const value = params?.[key];
    return value ?? defaultValue;
  }

  getMethod(): string | undefined {
    return this.event.httpMethod;
  }

  getPath(): string | undefined {
    return this.event.path;
  }

  protected headerLookup(normalizedHeaderName: string): string | undefined {
    const headers = this.event.headers ?? {};
    for (const [name, value] of Object.entries(headers)) {
      if (name.toLowerCase() === normalizedHeaderName) {
        return value ?? undefined;
      }
    }

    const multiHeaders = this.event.multiValueHeaders ?? {};
    for (const [name, values] of Object.entries(multiHeaders)) {
      if (name.toLowerCase() === normalizedHeaderName) {
        const first = Array.isArray(values) ? values[0] : undefined;
        return first ?? undefined;
      }
    }

    return undefined;
  }

  protected getQueryParamValue(key: string): string | undefined {
    const multiValues = this.event.multiValueQueryStringParameters;
    if (multiValues?.[key] && multiValues[key].length > 0) {
      return multiValues[key].join(",");
    }

    const singles = this.event.queryStringParameters ?? undefined;
    if (singles && key in singles) {
      return singles[key] ?? undefined;
    }

    return undefined;
  }
}
