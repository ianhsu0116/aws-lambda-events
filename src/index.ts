import { RestApiRequest } from "./adapters/rest-api-request.js";
import { HttpApiRequest } from "./adapters/http-api-request.js";
import { Response as RestApiResponse } from "./response/rest-api.js";
import { Response as HttpApiResponse } from "./response/http-api.js";

export { detectEventKind } from "./adapters/detect.js";
export { UnsupportedEventError, BodyParseError, ValidationError } from "./core/errors.js";
export { RestApiRequest } from "./adapters/rest-api-request.js";
export { HttpApiRequest } from "./adapters/http-api-request.js";
export type {
  AnyProxyEvent,
  EventKind,
  ProxyEventV1,
  ProxyEventV2,
  ProxyEventV1WithCognitoAuthorizer,
  ProxyEventV2WithJWTAuthorizer,
  ValidationSource,
  Validator,
} from "./core/types.js";
export type { Request } from "./core/request.js";

export const RestApi = {
  Request: RestApiRequest,
  Response: RestApiResponse,
};

export const HttpApi = {
  Request: HttpApiRequest,
  Response: HttpApiResponse,
};

export { createJoiValidator } from "./validators/joi.js";
export { createZodValidator } from "./validators/zod.js";
