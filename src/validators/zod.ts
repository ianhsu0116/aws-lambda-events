import type { Validator } from "../core/types.js";
import { ValidationError } from "../core/errors.js";
import type { ZodType } from "zod";

export function createZodValidator<T = unknown>(
  zodSchema: ZodType<T>
): Validator<T> {
  return {
    validate(value: unknown): T {
      const result = zodSchema.safeParse(value);

      if (!result.success) {
        throw new ValidationError("Validation failed", result.error.issues);
      }

      return result.data;
    },
  };
}
