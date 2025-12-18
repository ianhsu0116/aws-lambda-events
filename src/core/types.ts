import type {
  APIGatewayProxyEvent as ProxyEventV1,
  APIGatewayProxyEventV2 as ProxyEventV2,
  APIGatewayProxyWithCognitoAuthorizerEvent as ProxyEventV1WithCognitoAuthorizer,
  APIGatewayProxyEventV2WithJWTAuthorizer as ProxyEventV2WithJWTAuthorizer,
} from "aws-lambda";

export type {
  ProxyEventV1,
  ProxyEventV2,
  ProxyEventV1WithCognitoAuthorizer,
  ProxyEventV2WithJWTAuthorizer,
};

export type AnyProxyEvent =
  | ProxyEventV1
  | ProxyEventV2
  | ProxyEventV1WithCognitoAuthorizer
  | ProxyEventV2WithJWTAuthorizer;

export type BodyParser = (rawBody: string, contentType?: string) => unknown;

export type ValueCaster = (value: unknown) => unknown;

export type EventKind = "v1" | "v2";
