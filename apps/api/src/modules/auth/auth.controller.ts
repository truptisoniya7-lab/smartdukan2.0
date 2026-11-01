import type { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';

// ─────────────────────────────────────────────────────────────
// Auth Controller — HTTP translation only, no business logic
// ─────────────────────────────────────────────────────────────

const REFRESH_COOKIE = 'sd_refresh';

function setCookieRefresh(res: Response, rawToken: string) {
  res.cookie(REFRESH_COOKIE, rawToken, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/api/v1/auth',
  });
}

function clearCookieRefresh(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
}

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessToken, rawRefresh, expiresIn } = await authService.login(req.body, {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      });
      setCookieRefresh(res, rawRefresh);
      res.json({ accessToken, expiresIn });
    } catch (err) {
      next(err);
    }
  },

  async requestOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.requestOtp(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessToken, rawRefresh, expiresIn } = await authService.verifyOtp(req.body, {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      });
      setCookieRefresh(res, rawRefresh);
      res.json({ accessToken, expiresIn });
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const rawToken = req.cookies[REFRESH_COOKIE] as string | undefined;
      if (!rawToken) {
        return res.status(401).json({
          code: 'TOKEN_MISSING',
          detail: 'No refresh token cookie.',
        });
      }
      const { accessToken, rawRefresh, expiresIn } = await authService.refresh(rawToken, {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      });
      setCookieRefresh(res, rawRefresh);
      res.json({ accessToken, expiresIn });
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const rawToken = req.cookies[REFRESH_COOKIE] as string | undefined;
      if (rawToken) await authService.logout(rawToken);
      clearCookieRefresh(res);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
};
