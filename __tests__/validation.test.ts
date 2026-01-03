import Joi from "joi";
import { createJoiValidator, RestApi, ValidationError } from "../src/index.js";
import type { ProxyEventV1 } from "../src/core/types.js";

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

describe("request.validate()", () => {
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
    const validated = request.validate(validator);

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

    expect(() => request.validate(validator)).toThrow(ValidationError);
  });

  it("throws ValidationError on invalid field value", () => {
    const payload = { name: "Charlie", age: -5 };
    const event = makeRestEvent({
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const request = new RestApi.Request(event);
    const validator = createJoiValidator(schema);

    expect(() => request.validate(validator)).toThrow(ValidationError);
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
      request.validate(validator);
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
    const validated = request.validate(validator);

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
      request.validate(validator);
      fail("Should have thrown ValidationError");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const details = (error as ValidationError).details as any[];
      expect(details.length).toBe(1);
    }
  });
});
