import type { Validator } from "../core/types.js";
import { ValidationError } from "../core/errors.js";
import type Joi from "joi";

export function createJoiValidator<T = unknown>(
  joiSchema: Joi.ObjectSchema<T>
): Validator<T> {
  return {
    validate(value: unknown): T {
      const result = joiSchema.validate(value);

      if (result.error) {
        throw new ValidationError(result.error.message, result.error.details);
      }

      return result.value;
    },
  };
}
