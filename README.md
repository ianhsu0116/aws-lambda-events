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
import type { AnyProxyEvent } from "aws-lambda-events";

export async function handler(event: AnyProxyEvent) {
  // Pick the right wrapper yourself based on your API Gateway setup.
  const request =
    event.version === "2.0" ? new HttpApi.Request(event) : new RestApi.Request(event);

  const pathId = request.getPathParam("id", "n/a");

  const query = request.getQueryStr("q");
  const queryMap = request.getQueryStrs(["q", "lang"], "n/a");

  const bodyTitle = request.getInput("title", "n/a");
  const bodyInputs = request.getInputs(["title", "status"]);

  return {
    statusCode: 200,
    body: JSON.stringify({ pathId, query, queryMap, bodyTitle, bodyInputs }),
  };
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

---

## Notes

- Base64 bodies are decoded before parsing.
- Header lookups are case-insensitive.
- For HTTP API (v2.0), query reconstruction uses `rawQueryString` to preserve duplicates before joining.
- For REST API (v1.0), `multiValueQueryStringParameters` is preferred when present; values are comma-joined.

---

## License

MIT
