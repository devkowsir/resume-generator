import { Request, RequestHandler } from 'express';
import { fromError } from 'zod-validation-error';
import { HttpException } from '../exceptions/http';

export function validationMiddleware(schema: Zod.ZodSchema, property: keyof Request): RequestHandler {
  return (req, _, next) => {
    // @ts-expect-error: proper `property` variable typing is required.
    const { success, error } = schema.safeParse(req[property]);
    if (success) next();
    else next(new HttpException(400, fromError(error).toString()));
  };
}
