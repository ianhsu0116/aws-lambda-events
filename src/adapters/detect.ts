import { UnsupportedEventError } from "../core/errors.js";
import type { AnyProxyEvent, EventKind } from "../core/types.js";

export function detectEventKind(event: AnyProxyEvent): EventKind {
  if (("version" in event && event.version === "2.0") || "rawPath" in event) {
    return "v2";
  }

  if ("httpMethod" in event && "path" in event) {
    return "v1";
  }

  throw new UnsupportedEventError();
}
