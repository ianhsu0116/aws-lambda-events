import { BodyParseError } from "./errors.js";
import type { AnyProxyEvent } from "./types.js";

type ParsedBody =
  | { kind: "empty" }
  | { kind: "json"; value: unknown }
  | { kind: "form"; value: Record<string, string | string[]> }
  | { kind: "text"; value: string };

export interface Request {
  getPathParam(key: string, defaultValue?: string): string | undefined;
  getQueryStr(key: string, defaultValue?: string): string | undefined;
  getQueryStrs(keys: string[], defaultValue?: string): Record<string, string | undefined>;
  getInput<T = unknown>(key: string, defaultValue?: T): T | undefined;
  getInputs<T = unknown>(keys: string[], defaultValue?: T): Record<string, T | undefined>;
  getHeader(name: string, defaultValue?: string): string | undefined;
  getMethod(): string | undefined;
  getPath(): string | undefined;
  getRawBody(): string | undefined;
  getJsonBody<T = unknown>(): T | undefined;
}

export abstract class BaseRequest<E extends AnyProxyEvent> implements Request {
  protected readonly event: E;
  private parsedBody?: ParsedBody;

  constructor(event: E) {
    this.event = event;
  }

  abstract getPathParam(key: string, defaultValue?: string): string | undefined;

  getQueryStr(key: string, defaultValue?: string): string | undefined {
    const value = this.getQueryParamValue(key);
    return value ?? defaultValue;
  }

  getQueryStrs(keys: string[], defaultValue?: string): Record<string, string | undefined> {
    const result: Record<string, string | undefined> = {};
    for (const key of keys) {
      result[key] = this.getQueryStr(key, defaultValue);
    }
    return result;
  }

  getInput<T = unknown>(key: string, defaultValue?: T): T | undefined {
    const body = this.ensureParsedBody();
    if (body.kind === "json" && typeof body.value === "object" && body.value !== null) {
      const value = (body.value as Record<string, unknown>)[key];
      return (value as T | undefined) ?? defaultValue;
    }

    if (body.kind === "form") {
      const value = body.value[key];
      return (value as T | undefined) ?? defaultValue;
    }

    return defaultValue;
  }

  getInputs<T = unknown>(keys: string[], defaultValue?: T): Record<string, T | undefined> {
    const result: Record<string, T | undefined> = {};
    for (const key of keys) {
      result[key] = this.getInput<T>(key, defaultValue);
    }
    return result;
  }

  getHeader(name: string, defaultValue?: string): string | undefined {
    const normalized = name.toLowerCase();
    const value = this.headerLookup(normalized);
    return value ?? defaultValue;
  }

  getMethod(): string | undefined {
    return undefined;
  }

  getPath(): string | undefined {
    return undefined;
  }

  getRawBody(): string | undefined {
    const bodyValue = this.event.body;
    if (bodyValue === undefined || bodyValue === null || bodyValue === "") {
      return undefined;
    }

    const isBase64 = (this.event as { isBase64Encoded?: boolean }).isBase64Encoded;
    if (isBase64) {
      return Buffer.from(bodyValue, "base64").toString("utf8");
    }
    return bodyValue;
  }

  getJsonBody<T = unknown>(): T | undefined {
    const body = this.ensureParsedBody();
    if (body.kind === "json") {
      return body.value as T;
    }
    return undefined;
  }

  protected abstract headerLookup(normalizedHeaderName: string): string | undefined;
  protected abstract getQueryParamValue(key: string): string | undefined;

  private ensureParsedBody(): ParsedBody {
    if (this.parsedBody) {
      return this.parsedBody;
    }

    const rawBody = this.getRawBody();
    if (!rawBody) {
      this.parsedBody = { kind: "empty" };
      return this.parsedBody;
    }

    const contentTypeHeader = this.getHeader("content-type");
    const normalizedContentType = contentTypeHeader?.split(";")[0]?.trim().toLowerCase();

    if (normalizedContentType === "application/json") {
      try {
        this.parsedBody = { kind: "json", value: JSON.parse(rawBody) };
        return this.parsedBody;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid JSON body";
        throw new BodyParseError(message);
      }
    }

    if (normalizedContentType === "application/x-www-form-urlencoded") {
      const parsedForm = this.parseFormBody(rawBody);
      this.parsedBody = { kind: "form", value: parsedForm };
      return this.parsedBody;
    }

    this.parsedBody = { kind: "text", value: rawBody };
    return this.parsedBody;
  }

  private parseFormBody(rawBody: string): Record<string, string | string[]> {
    const params = new URLSearchParams(rawBody);
    const result: Record<string, string | string[]> = {};

    for (const key of params.keys()) {
      const values = params.getAll(key);
      const lastValue = values.at(-1) ?? "";
      result[key] = lastValue;
    }

    return result;
  }
}
