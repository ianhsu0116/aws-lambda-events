# aws-lambda-events

Small TypeScript helpers to read inputs from AWS API Gateway proxy events (REST payload v1.0 and HTTP payload v2.0). The `RestApi.Request` and `HttpApi.Request` wrappers normalize how you read path params, query strings, and body inputs.

---

## Installation

```bash
npm install aws-lambda-events
# or
yarn add aws-lambda-events
```

---

## Supported events

- REST API (proxy payload v1.0), with or without Cognito authorizer.
- HTTP API (proxy payload v2.0), with or without JWT authorizer.

The library auto-detects v1 vs v2; you choose the matching wrapper:
- `new RestApi.Request(event)` for REST API (v1.0).
- `new HttpApi.Request(event)` for HTTP API (v2.0).

---

## Quick start

```typescript
import { RestApi, HttpApi } from "aws-lambda-events";
import type { AnyProxyEvent, ProxyEventV1, ProxyEventV2 } from "aws-lambda-events";

export async function handler(event: AnyProxyEvent) {
  // Pick the right wrapper yourself based on your API Gateway setup.
  const request =
    (event as any).version === "2.0"
      ? new HttpApi.Request(event as ProxyEventV2)
      : new RestApi.Request(event as ProxyEventV1);

  const pathId = request.getPathParam("id", "n/a");

  const query = request.getQueryStr("q");
  const queryMap = request.getQueryStrs(["q", "lang"], "n/a");

  const bodyTitle = request.getInput("title", "n/a");
  const bodyInputs = request.getInputs(["title", "status"]);

  return HttpApi.Response.json({ pathId, query, queryMap, bodyTitle, bodyInputs });
}
```

---

## API

### `getPathParam(key, defaultValue?)`
- Returns a single path parameter value.
- If missing, returns `defaultValue` or `undefined`.

### `getQueryStr(key, defaultValue?)`
- Returns the query string value for `key`.
- If the key appears multiple times, values are joined with commas (e.g., `a=1&a=2` ⇒ `"1,2"`).
- If missing, returns `defaultValue` or `undefined`.

### `getQueryStrs(keys, defaultValue?)`
- Takes an array of keys and returns a map `{ [key]: value | undefined }`.
- Each value follows the same rules as `getQueryStr` (comma-joined duplicates, default when missing).

### `getInput(key, defaultValue?)`
- Lazily parses the body (JSON or `application/x-www-form-urlencoded`; otherwise treated as text).
- Returns the field value from the parsed body.
- If missing, returns `defaultValue` or `undefined`.

### `getInputs(keys, defaultValue?)`
- Takes an array of body field keys and returns a map `{ [key]: value | undefined }`.
- Each value follows the same rules as `getInput` (default when missing).

### `getRequestTimeEpoch()`
- Returns the event trigger time as a Unix timestamp in milliseconds.
- Returns `undefined` if the time field is not available.

### `validate(validator, source)`
- Validates request data using a validator instance.
- `source` specifies which part of the request to validate:
  - `"body"` – validates the JSON body (`getJsonBody()`).
  - `"query"` – validates query string parameters.
  - `"path"` – validates path parameters.
- Returns the validated data (potentially transformed by the validator).
- Throws `ValidationError` if validation fails.

---

## Validation

The library supports request validation using validator adapters. Validate body, query, or path parameters. Currently supports **Joi** and **Zod**.

### Option A: Using Joi

1. **Install Joi**:
   ```bash
   npm install joi
   # or
   yarn add joi
   ```

2. **Usage**:
   ```typescript
   import Joi from "joi";
   import { RestApi, ProxyEventV1, createJoiValidator, ValidationError } from "aws-lambda-events";

   const schema = Joi.object({
     title: Joi.string().min(3).max(100).required(),
     content: Joi.string().required(),
     tags: Joi.array().items(Joi.string()).optional(),
   });

   export async function handler(event: ProxyEventV1) {
     const request = new RestApi.Request(event);

     try {
       const validator = createJoiValidator(schema);
       const body = request.validate(validator, "body");
       
       // body is validated and type-safe
       return RestApi.Response.json({ success: true, data: body }, 201);
     } catch (error) {
       if (error instanceof ValidationError) {
         return RestApi.Response.json(
           { error: "Validation failed", details: error.details },
           400
         );
       }
       throw error;
     }
   }
   ```

### Option B: Using Zod

1. **Install Zod**:
   ```bash
   npm install zod
   # or
   yarn add zod
   ```

2. **Usage**:
   ```typescript
   import { z } from "zod";
   import { RestApi, ProxyEventV1, createZodValidator, ValidationError } from "aws-lambda-events";

   const schema = z.object({
     title: z.string().min(3).max(100),
     content: z.string(),
     tags: z.array(z.string()).optional(),
   });

   export async function handler(event: ProxyEventV1) {
     const request = new RestApi.Request(event);

     try {
       const validator = createZodValidator(schema);
       const body = request.validate(validator, "body");
       
       // body is validated and inferred from Zod schema
       return RestApi.Response.json({ success: true, data: body }, 201);
     } catch (error) {
       if (error instanceof ValidationError) {
         // error.details contains ZodIssue[]
         return RestApi.Response.json(
           { error: "Validation failed", details: error.details },
           400
         );
       }
       throw error;
     }
   }
   ```

---

## Notes

- Base64 bodies are decoded before parsing.
- Header lookups are case-insensitive.
- For HTTP API (v2.0), query reconstruction uses `rawQueryString` to preserve duplicates before joining.
- For REST API (v1.0), `multiValueQueryStringParameters` is preferred when present; values are comma-joined.

---

## License

MIT
