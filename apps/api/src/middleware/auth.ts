import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'node:fs';
import { env } from '../config/env.js';
import { createApiError } from './errorHandler.js';
import type { Role } from '@smart-dukan/shared';

// ─────────────────────────────────────────────────────────────
// JWT Auth Middleware
// ─────────────────────────────────────────────────────────────

import path from 'node:path';

let publicKey: string | null = null;

function getPublicKey(): string {
  if (!publicKey) {
    const rawPath = env.JWT_PUBLIC_KEY_PATH;
    const candidates = [
      rawPath,
      path.resolve(process.cwd(), rawPath),
      path.resolve(process.cwd(), 'apps/api', rawPath),
    ];
    const found = candidates.find((p) => fs.existsSync(p));
    if (!found) {
      throw new Error(`Public key not found at ${rawPath}. Checked: ${candidates.join(', ')}`);
    }
    publicKey = fs.readFileSync(found, 'utf-8');
  }
  return publicKey;
}

export interface JwtPayload {
  sub: string;   // userId
  role: Role;
  name: string;
  iat: number;
  exp: number;
}

// Attaches decoded token to res.locals.user
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(
      createApiError({
        status: 401,
        code: 'UNAUTHORIZED',
        title: 'Unauthorized',
        detail: 'Missing or invalid Authorization header.',
      }),
    );
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, getPublicKey(), { algorithms: ['RS256'] }) as JwtPayload;
    res.locals['user'] = payload;
    next();
  } catch {
    next(
      createApiError({
        status: 401,
        code: 'TOKEN_EXPIRED',
        title: 'Unauthorized',
        detail: 'Access token is invalid or expired.',
      }),
    );
  }
}

// Role-based access control gate
export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = res.locals['user'] as JwtPayload | undefined;
    if (!user || !roles.includes(user.role)) {
      return next(
        createApiError({
          status: 403,
          code: 'FORBIDDEN',
          title: 'Forbidden',
          detail: 'You do not have permission to access this resource.',
        }),
      );
    }
    next();
  };
}

// Shorthand helpers
export const requireCustomer = authorize('CUSTOMER' as Role);
export const requireShopkeeper = authorize('SHOPKEEPER' as Role);
export const requireRider = authorize('RIDER' as Role);
export const requireAdmin = authorize('ADMIN' as Role);
