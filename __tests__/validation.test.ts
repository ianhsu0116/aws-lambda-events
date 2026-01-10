import Joi from "joi";
import { z } from "zod";
import {
  createJoiValidator,
  createZodValidator,
  RestApi,
  HttpApi,
  ValidationError,
} from "../src/index.js";
import type { ProxyEventV1, ProxyEventV2 } from "../src/core/types.js";

function makeRestEvent(overrides: Partial<ProxyEventV1> = {}): ProxyEventV1 {
  return {
    resource: "/",
    path: "/",
    httpMethod: "POST",
    headers: {},
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    body: null,
    isBase64Encoded: false,
    ...overrides,
  };
}

function makeHttpEvent(overrides: Partial<ProxyEventV2> = {}): ProxyEventV2 {
  return {
    version: "2.0",
    routeKey: "$default",
    rawPath: "/",
    rawQueryString: "",
    headers: {},
    requestContext: {
      accountId: "",
      apiId: "",
      domainName: "",
      domainPrefix: "",
      http: { method: "GET", path: "/", protocol: "HTTP/1.1", sourceIp: "", userAgent: "" },
      requestId: "",
      routeKey: "$default",
      stage: "$default",
      time: "",
      timeEpoch: 0,
    },
    isBase64Encoded: false,
    ...overrides,
  };
}

describe("validate() with body", () => {
  describe("Joi", () => {
    const schema = Joi.object({
      name: Joi.string().required(),
      age: Joi.number().min(0).required(),
      email: Joi.string().email().optional(),
    });

    it("validates valid body successfully", () => {
      const payload = { name: "Alice", age: 30, email: "alice@example.com" };
      const event = makeRestEvent({
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const request = new RestApi.Request(event);
      const validator = createJoiValidator(schema);
      const validated = request.validate(validator, "body");

      expect(validated).toEqual(payload);
    });

    it("throws ValidationError on missing required field", () => {
      const payload = { name: "Bob" };
      const event = makeRestEvent({
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const request = new RestApi.Request(event);
      const validator = createJoiValidator(schema);

      expect(() => request.validate(validator, "body")).toThrow(ValidationError);
    });

    it("throws ValidationError on invalid field value", () => {
      const payload = { name: "Charlie", age: -5 };
      const event = makeRestEvent({
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const request = new RestApi.Request(event);
      const validator = createJoiValidator(schema);

      expect(() => request.validate(validator, "body")).toThrow(ValidationError);
    });

    it("provides validation details in error", () => {
      const payload = { age: 25 };
      const event = makeRestEvent({
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const request = new RestApi.Request(event);
      const validator = createJoiValidator(schema);

      try {
        request.validate(validator, "body");
        fail("Should have thrown ValidationError");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).details).toBeDefined();
        expect((error as ValidationError).message).toContain("required");
      }
    });

    it("strips unknown fields by default", () => {
      const payload = { name: "Dave", age: 25, unknown: "data" };
      const event = makeRestEvent({
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const request = new RestApi.Request(event);
      const schemaWithStrip = schema.options({ stripUnknown: true });
      const validator = createJoiValidator(schemaWithStrip);
      const validated = request.validate(validator, "body");

      expect(validated).toEqual({ name: "Dave", age: 25 });
      expect(validated).not.toHaveProperty("unknown");
    });

    it("respects Joi schema options", () => {
      const payload = {};
      const event = makeRestEvent({
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const request = new RestApi.Request(event);
      const schemaWithAbort = schema.options({ abortEarly: true });
      const validator = createJoiValidator(schemaWithAbort);

      try {
        request.validate(validator, "body");
        fail("Should have thrown ValidationError");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const details = (error as ValidationError).details as any[];
        expect(details.length).toBe(1);
      }
    });
  });

  describe("Zod", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number().min(0),
      email: z.email().optional(),
    });

    it("validates valid body successfully", () => {
      const payload = { name: "Alice", age: 30, email: "alice@example.com" };
      const event = makeRestEvent({
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const request = new RestApi.Request(event);
      const validator = createZodValidator(schema);
      const validated = request.validate(validator, "body");

      expect(validated).toEqual(payload);
    });

    it("throws ValidationError on missing required field", () => {
      const payload = { name: "Bob" };
      const event = makeRestEvent({
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const request = new RestApi.Request(event);
      const validator = createZodValidator(schema);

      expect(() => request.validate(validator, "body")).toThrow(ValidationError);
    });

    it("throws ValidationError on invalid field value", () => {
      const payload = { name: "Charlie", age: -5 };
      const event = makeRestEvent({
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const request = new RestApi.Request(event);
      const validator = createZodValidator(schema);

      expect(() => request.validate(validator, "body")).toThrow(ValidationError);
    });

    it("provides validation details in error", () => {
      const payload = { age: 25 };
      const event = makeRestEvent({
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const request = new RestApi.Request(event);
      const validator = createZodValidator(schema);

      try {
        request.validate(validator, "body");
        fail("Should have thrown ValidationError");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).details).toBeDefined();
        expect((error as ValidationError).message).toContain("Validation failed");
      }
    });

    it("strips unknown fields by default", () => {
      const payload = { name: "Dave", age: 25, unknown: "data" };
      const event = makeRestEvent({
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const request = new RestApi.Request(event);
      const validator = createZodValidator(schema);
      const validated = request.validate(validator, "body");

      expect(validated).toEqual({ name: "Dave", age: 25 });
      expect(validated).not.toHaveProperty("unknown");
    });
  });
});

describe("validate() with query parameters", () => {
  describe("Zod", () => {
    const querySchema = z.object({
      limit: z.string().regex(/^\d+$/).transform(Number),
      status: z.enum(["active", "inactive"]).optional(),
    });

    it("validates query params for REST API (V1)", () => {
      const event = makeRestEvent({
        queryStringParameters: { limit: "10", status: "active" },
      });
      const request = new RestApi.Request(event);
      const validator = createZodValidator(querySchema);
      const validated = request.validate(validator, "query");

      expect(validated).toEqual({ limit: 10, status: "active" });
    });

    it("validates query params for HTTP API (V2)", () => {
      const event = makeHttpEvent({
        queryStringParameters: { limit: "25", status: "inactive" },
      });
      const request = new HttpApi.Request(event);
      const validator = createZodValidator(querySchema);
      const validated = request.validate(validator, "query");

      expect(validated).toEqual({ limit: 25, status: "inactive" });
    });

    it("validates empty object when queryStringParameters is null", () => {
      const event = makeRestEvent({ queryStringParameters: null });
      const request = new RestApi.Request(event);
      const optionalSchema = z.object({
        limit: z.string().optional(),
      });
      const validator = createZodValidator(optionalSchema);
      const validated = request.validate(validator, "query");

      expect(validated).toEqual({});
    });

    it("throws ValidationError on invalid query params", () => {
      const event = makeRestEvent({
        queryStringParameters: { limit: "not-a-number" },
      });
      const request = new RestApi.Request(event);
      const validator = createZodValidator(querySchema);

      expect(() => request.validate(validator, "query")).toThrow(ValidationError);
    });
  });

  describe("Joi", () => {
    const querySchema = Joi.object({
      limit: Joi.number().integer().min(1).required(),
      status: Joi.string().valid("active", "inactive").optional(),
    });

    it("validates and coerces query params for REST API (V1)", () => {
      const event = makeRestEvent({
        queryStringParameters: { limit: "10", status: "active" },
      });
      const request = new RestApi.Request(event);
      const validator = createJoiValidator(querySchema);
      const validated = request.validate(validator, "query");

      expect(validated).toEqual({ limit: 10, status: "active" });
    });

    it("validates query params for HTTP API (V2)", () => {
      const event = makeHttpEvent({
        queryStringParameters: { limit: "25" },
      });
      const request = new HttpApi.Request(event);
      const validator = createJoiValidator(querySchema);
      const validated = request.validate(validator, "query");

      expect(validated).toEqual({ limit: 25 });
    });
  });
});

describe("validate() with path parameters", () => {
  describe("Zod", () => {
    const pathSchema = z.object({
      eventId: z.string().uuid(),
      userId: z.string().min(1),
    });

    it("validates path params for REST API (V1)", () => {
      const event = makeRestEvent({
        pathParameters: {
          eventId: "550e8400-e29b-41d4-a716-446655440000",
          userId: "user123",
        },
      });
      const request = new RestApi.Request(event);
      const validator = createZodValidator(pathSchema);
      const validated = request.validate(validator, "path");

      expect(validated).toEqual({
        eventId: "550e8400-e29b-41d4-a716-446655440000",
        userId: "user123",
      });
    });

    it("validates path params for HTTP API (V2)", () => {
      const event = makeHttpEvent({
        pathParameters: {
          eventId: "550e8400-e29b-41d4-a716-446655440000",
          userId: "abc",
        },
      });
      const request = new HttpApi.Request(event);
      const validator = createZodValidator(pathSchema);
      const validated = request.validate(validator, "path");

      expect(validated).toEqual({
        eventId: "550e8400-e29b-41d4-a716-446655440000",
        userId: "abc",
      });
    });

    it("validates empty object when pathParameters is null", () => {
      const event = makeRestEvent({ pathParameters: null });
      const request = new RestApi.Request(event);
      const optionalSchema = z.object({
        id: z.string().optional(),
      });
      const validator = createZodValidator(optionalSchema);
      const validated = request.validate(validator, "path");

      expect(validated).toEqual({});
    });

    it("throws ValidationError on invalid UUID", () => {
      const event = makeRestEvent({
        pathParameters: { eventId: "not-a-uuid", userId: "user1" },
      });
      const request = new RestApi.Request(event);
      const validator = createZodValidator(pathSchema);

      expect(() => request.validate(validator, "path")).toThrow(ValidationError);
    });
  });

  describe("Joi", () => {
    const pathSchema = Joi.object({
      eventId: Joi.string().uuid().required(),
      userId: Joi.string().min(1).required(),
    });

    it("validates path params for REST API (V1)", () => {
      const event = makeRestEvent({
        pathParameters: {
          eventId: "550e8400-e29b-41d4-a716-446655440000",
          userId: "user123",
        },
      });
      const request = new RestApi.Request(event);
      const validator = createJoiValidator(pathSchema);
      const validated = request.validate(validator, "path");

      expect(validated).toEqual({
        eventId: "550e8400-e29b-41d4-a716-446655440000",
        userId: "user123",
      });
    });
  });
});

describe("validate() combined sources", () => {
  it("validates body, query, and path in same handler", () => {
    const bodySchema = z.object({ title: z.string() });
    const querySchema = z.object({ limit: z.string().transform(Number) });
    const pathSchema = z.object({ id: z.string() });

    const event = makeRestEvent({
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Test Event" }),
      queryStringParameters: { limit: "10" },
      pathParameters: { id: "123" },
    });

    const request = new RestApi.Request(event);

    const body = request.validate(createZodValidator(bodySchema), "body");
    const query = request.validate(createZodValidator(querySchema), "query");
    const path = request.validate(createZodValidator(pathSchema), "path");

    expect(body).toEqual({ title: "Test Event" });
    expect(query).toEqual({ limit: 10 });
    expect(path).toEqual({ id: "123" });
  });
});
