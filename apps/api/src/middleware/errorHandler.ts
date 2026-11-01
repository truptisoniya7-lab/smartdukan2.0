import type { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';

// ─────────────────────────────────────────────────────────────
// RFC 7807 problem+json error format
// ─────────────────────────────────────────────────────────────

export interface ApiError extends Error {
  status: number;
  code: string;
  title: string;
  detail: string;
  errors?: Record<string, string[]>;
}

export function createApiError(opts: {
  status: number;
  code: string;
  title: string;
  detail: string;
  errors?: Record<string, string[]>;
}): ApiError {
  const err = new Error(opts.detail) as ApiError;
  err.status = opts.status;
  err.code = opts.code;
  err.title = opts.title;
  err.detail = opts.detail;
  if (opts.errors) err.errors = opts.errors;
  return err;
}

// ─────────────────────────────────────────────────────────────
// Global error handler — must be last middleware
// ─────────────────────────────────────────────────────────────

export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  const apiErr = err as ApiError;
  const status = apiErr.status ?? 500;
  const code = apiErr.code ?? 'INTERNAL_ERROR';

  if (status >= 500) {
    logger.error({ err, requestId: res.locals['requestId'] }, 'Unhandled error');
  }

  res.status(status).json({
    type: `https://smartdukan.app/errors/${code.toLowerCase()}`,
    title: apiErr.title ?? 'Internal Server Error',
    status,
    detail: status >= 500 ? 'An unexpected error occurred.' : apiErr.detail,
    code,
    instance: req.path,
    ...(apiErr.errors && { errors: apiErr.errors }),
  });
}

// ─────────────────────────────────────────────────────────────
// 404 handler
// ─────────────────────────────────────────────────────────────

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    type: 'https://smartdukan.app/errors/not-found',
    title: 'Not Found',
    status: 404,
    detail: `Route ${req.method} ${req.path} not found.`,
    code: 'NOT_FOUND',
    instance: req.path,
  });
}
