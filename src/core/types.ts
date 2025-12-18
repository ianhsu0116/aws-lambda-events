import type {
  APIGatewayProxyEvent as ProxyEventV1,
  APIGatewayProxyEventV2 as ProxyEventV2,
} from "aws-lambda";

export type { ProxyEventV1, ProxyEventV2 };

export type AnyProxyEvent = ProxyEventV1 | ProxyEventV2;

export type BodyParser = (rawBody: string, contentType?: string) => unknown;

export type ValueCaster = (value: unknown) => unknown;

export interface RequestOptions {
  formDuplicateKeyMode?: "last" | "array";
}

export type EventKind = "v1" | "v2";
