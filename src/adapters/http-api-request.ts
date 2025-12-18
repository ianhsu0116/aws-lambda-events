import { BaseRequest } from "../core/request.js";
import { UnsupportedEventError } from "../core/errors.js";
import { detectEventKind } from "./detect.js";
import type { ProxyEventV2, RequestOptions } from "../core/types.js";

export class HttpApiRequest extends BaseRequest<ProxyEventV2> {
  private readonly rawQueryMap: Record<string, string[]>;

  constructor(event: ProxyEventV2, options?: RequestOptions) {
    super(event, options);
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
    const fromEvent = this.event.queryStringParameters ?? {};
    if (key in fromEvent) {
      return fromEvent[key] ?? undefined;
    }

    const rawValues = this.rawQueryMap[key];
    if (rawValues && rawValues.length > 0) {
      return rawValues[0];
    }

    return undefined;
  }

  protected getQueryParamValues(key: string): string[] | undefined {
    const rawValues = this.rawQueryMap[key];
    if (rawValues && rawValues.length > 0) {
      return rawValues;
    }

    const fromEvent = this.event.queryStringParameters ?? {};
    if (key in fromEvent) {
      const value = fromEvent[key];
      return value === undefined || value === null ? undefined : [value];
    }

    return undefined;
  }

  private parseRawQuery(rawQuery: string): Record<string, string[]> {
    if (!rawQuery) {
      return {};
    }

    const params = new URLSearchParams(rawQuery);
    const map: Record<string, string[]> = {};

    for (const [key, value] of params.entries()) {
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(value);
    }

    return map;
  }
}
