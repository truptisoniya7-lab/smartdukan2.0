import type { Request, Response, NextFunction } from 'express';
import type { AnyZodObject, ZodError } from 'zod';
import { createApiError } from './errorHandler.js';

// ─────────────────────────────────────────────────────────────
// Zod request validation middleware
// Validates req.body, req.query, req.params
// Strips unknown keys, enriches validated data back onto req
// ─────────────────────────────────────────────────────────────

interface ValidateOptions {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export function validate(schemas: ValidateOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as typeof req.query;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }
      next();
    } catch (err) {
      const zodError = err as ZodError;
      const fieldErrors: Record<string, string[]> = {};
      zodError.errors.forEach((e) => {
        const path = e.path.join('.');
        if (!fieldErrors[path]) fieldErrors[path] = [];
        fieldErrors[path]!.push(e.message);
      });
      next(
        createApiError({
          status: 422,
          code: 'VALIDATION_ERROR',
          title: 'Validation Failed',
          detail: 'One or more fields failed validation.',
          errors: fieldErrors,
        }),
      );
    }
  };
}
