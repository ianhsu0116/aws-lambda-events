import { BodyParseError, HttpApi, RestApi, detectEventKind } from "../src/index.js";
import type { ProxyEventV1, ProxyEventV2 } from "../src/core/types.js";

function makeRestEvent(overrides: Partial<ProxyEventV1> = {}): ProxyEventV1 {
  return {
    resource: "/",
    path: "/",
    httpMethod: "GET",
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

describe("event detection", () => {
  it("classifies payload v1.0", () => {
    const event = makeRestEvent();
    expect(detectEventKind(event)).toBe("v1");
  });

  it("classifies payload v2.0", () => {
    const event = makeHttpEvent({ rawPath: "/hello" });
    expect(detectEventKind(event)).toBe("v2");
  });

  it("throws on unsupported event", () => {
    // @ts-expect-error intentionally invalid
    expect(() => detectEventKind({})).toThrow();
  });
});

describe("path parameters", () => {
  it("reads path params for REST API", () => {
    const event = makeRestEvent({ pathParameters: { id: "123" } });
    const request = new RestApi.Request(event);
    expect(request.getPathParam("id")).toBe("123");
    expect(request.getPathParam("missing", "n/a")).toBe("n/a");
    expect(request.getPathParam("missing")).toBeUndefined();
  });

  it("reads path params for HTTP API", () => {
    const event = makeHttpEvent({ pathParameters: { slug: "abc" } });
    const request = new HttpApi.Request(event);
    expect(request.getPathParam("slug")).toBe("abc");
    expect(request.getPathParam("missing", "n/a")).toBe("n/a");
    expect(request.getPathParam("missing")).toBeUndefined();
  });
});

describe("query strings", () => {
  it("prefers multiValue query params for payload v1.0", () => {
    const event = makeRestEvent({
      multiValueQueryStringParameters: { search: ["first", "second"] },
      queryStringParameters: { search: "single", other: "one" },
    });
    const request = new RestApi.Request(event);
    expect(request.getQueryStr("search")).toBe("first,second");
    expect(request.getQueryStrs(["search", "other"])).toEqual({
      search: "first,second",
      other: "one",
    });
    expect(request.getQueryStr("missing", "n/a")).toBe("n/a");
    expect(request.getQueryStrs(["missing"], "n/a")).toEqual({ missing: "n/a" });
  });

  it("reconstructs multi-values from rawQueryString in payload v2.0", () => {
    const event = makeHttpEvent({
      rawQueryString: "filter=one&filter=two&single=only",
      queryStringParameters: { filter: "one,two", single: "only" },
    });
    const request = new HttpApi.Request(event);
    expect(request.getQueryStr("filter")).toBe("one,two");
    expect(request.getQueryStrs(["filter", "single"])).toEqual({
      filter: "one,two",
      single: "only",
    });
    expect(request.getQueryStr("missing", "n/a")).toBe("n/a");
    expect(request.getQueryStrs(["missing"], "n/a")).toEqual({ missing: "n/a" });
  });
});

describe("body parsing", () => {
  it("parses JSON and exposes inputs", () => {
    const payload = { hello: "world", count: 2 };
    const event = makeRestEvent({
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const request = new RestApi.Request(event);
    expect(request.getInput("hello")).toBe("world");
    expect(request.getInputs(["hello", "count", "missing"], "n/a")).toEqual({
      hello: "world",
      count: 2,
      missing: "n/a",
    });
    expect(request.getJsonBody()).toEqual(payload);
  });

  it("throws BodyParseError on invalid JSON", () => {
    const event = makeRestEvent({
      headers: { "Content-Type": "application/json" },
      body: "{invalid",
    });
    const request = new RestApi.Request(event);
    expect(() => request.getInput("anything")).toThrow(BodyParseError);
  });

  it("parses form-urlencoded and returns last value for duplicate keys", () => {
    const body = "color=red&color=blue&single=one";
    const event = makeHttpEvent({
      headers: { "content-type": "application/x-www-form-urlencoded" },
      rawQueryString: "",
      body,
    });
    const request = new HttpApi.Request(event);
    expect(request.getInput("color")).toBe("blue");
    expect(request.getInput("single")).toBe("one");
    expect(request.getInput("missing", "n/a")).toBe("n/a");
    expect(request.getInputs(["color", "single", "missing"], "n/a")).toEqual({
      color: "blue",
      single: "one",
      missing: "n/a",
    });
  });

  it("decodes base64 bodies before parsing", () => {
    const payload = { nested: true };
    const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
    const event = makeRestEvent({
      headers: { "content-type": "application/json" },
      body: encoded,
      isBase64Encoded: true,
    });
    const request = new RestApi.Request(event);
    expect(request.getJsonBody()).toEqual(payload);
  });
});

describe("request time", () => {
  it("reads timeEpoch for HTTP API (V2)", () => {
    const event = makeHttpEvent({
      requestContext: {
        accountId: "",
        apiId: "",
        domainName: "",
        domainPrefix: "",
        http: { method: "GET", path: "/", protocol: "HTTP/1.1", sourceIp: "", userAgent: "" },
        requestId: "",
        routeKey: "$default",
        stage: "$default",
        time: "09/Apr/2015:12:34:56 +0000",
        timeEpoch: 1428582896000,
      },
    });
    const request = new HttpApi.Request(event);
    expect(request.getRequestTimeEpoch()).toBe(1428582896000);
  });

  it("reads requestTimeEpoch for REST API (V1)", () => {
    const event = makeRestEvent({
      requestContext: {
        requestTimeEpoch: 1428582896000,
      } as any,
    });
    const request = new RestApi.Request(event);
    expect(request.getRequestTimeEpoch()).toBe(1428582896000);
  });

  it("returns undefined when requestContext is missing time fields", () => {
    const event = makeRestEvent({
      requestContext: {} as any,
    });
    const request = new RestApi.Request(event);
    expect(request.getRequestTimeEpoch()).toBeUndefined();
  });
});

