import type { APIGatewayProxyStructuredResultV2 as ProxyResultV2 } from "aws-lambda";
import {
  type Headers,
  createJsonResponse,
  createTextResponse,
  createNoContentResponse,
  createRedirectResponse,
} from "./shared.js";

export class Response {
  static json(body: unknown, statusCode = 200, headers?: Headers): ProxyResultV2 {
    return createJsonResponse(body, statusCode, headers);
  }

  static text(body: string, statusCode = 200, headers?: Headers): ProxyResultV2 {
    return createTextResponse(body, statusCode, headers);
  }

  static noContent(headers?: Headers): ProxyResultV2 {
    return createNoContentResponse(headers);
  }

  static redirect(location: string, statusCode = 302, headers?: Headers): ProxyResultV2 {
    return createRedirectResponse(location, statusCode, headers);
  }
}
