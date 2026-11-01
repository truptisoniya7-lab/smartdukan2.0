import { v4 as uuidv4 } from 'uuid';
import type { Request, Response, NextFunction } from 'express';

// ─────────────────────────────────────────────────────────────
// Request ID middleware
// Attaches X-Request-Id to every response for trace correlation
// ─────────────────────────────────────────────────────────────

export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = (req.headers['x-request-id'] as string) ?? uuidv4();
  res.locals['requestId'] = id;
  res.setHeader('X-Request-Id', id);
  next();
}
