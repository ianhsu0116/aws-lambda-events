export class UnsupportedEventError extends Error {
  constructor(message = "Unsupported event shape") {
    super(message);
    this.name = "UnsupportedEventError";
  }
}

export class BodyParseError extends Error {
  constructor(message = "Failed to parse request body") {
    super(message);
    this.name = "BodyParseError";
  }
}
