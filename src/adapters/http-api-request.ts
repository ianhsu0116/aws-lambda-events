import { BaseRequest } from "../core/request.js";
import { UnsupportedEventError } from "../core/errors.js";
import { detectEventKind } from "./detect.js";
import type { ProxyEventV2, ProxyEventV2WithJWTAuthorizer } from "../core/types.js";

export class HttpApiRequest extends BaseRequest<ProxyEventV2 | ProxyEventV2WithJWTAuthorizer> {
  private readonly rawQueryMap: Record<string, string>;

  constructor(event: ProxyEventV2 | ProxyEventV2WithJWTAuthorizer) {
    super(event);
    const kind = detectEventKind(event);
    if (kind !== "v2") {
      throw new UnsupportedEventError("Expected payload v2.0 event");
    }

    this.rawQueryMap = this.parseRawQuery(event.rawQueryString ?? "");
  }

  getPathParam(key: string, defaultValue?: string): string | undefined {
    const params = this.event.pathParameters ?? {};
    const value = params?.[key];
    return value ?? defaultValue;
  }

  getMethod(): string | undefined {
    return this.event.requestContext?.http?.method;
  }

  getPath(): string | undefined {
    return this.event.rawPath;
  }

  protected headerLookup(normalizedHeaderName: string): string | undefined {
    const headers = this.event.headers ?? {};
    for (const [name, value] of Object.entries(headers)) {
      if (name.toLowerCase() === normalizedHeaderName) {
        return value ?? undefined;
      }
    }
    return undefined;
  }

  protected getQueryParamValue(key: string): string | undefined {
    const raw = this.rawQueryMap[key];
    if (raw !== undefined) {
      return raw;
    }

    const fromEvent = this.event.queryStringParameters ?? {};
    if (key in fromEvent) {
      return fromEvent[key] ?? undefined;
    }

    return undefined;
  }

  private parseRawQuery(rawQuery: string): Record<string, string> {
    if (!rawQuery) {
      return {};
    }

    const params = new URLSearchParams(rawQuery);
    const map: Record<string, string> = {};

    for (const key of params.keys()) {
      const allValues = params.getAll(key);
      if (allValues.length === 0) continue;
      map[key] = allValues.join(",");
    }

    return map;
  }
}
