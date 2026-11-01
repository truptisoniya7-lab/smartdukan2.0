import argon2 from 'argon2';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env.js';
import { createApiError } from '../../middleware/errorHandler.js';
import { authRepository } from './auth.repository.js';
import { shopRepository } from '../shop/shop.repository.js';
import type { RegisterDto, LoginDto, RequestOtpDto, VerifyOtpDto } from '@smart-dukan/shared';
import type { Role } from '@smart-dukan/shared';

// ─────────────────────────────────────────────────────────────
// Key loading (lazy, cached)
// ─────────────────────────────────────────────────────────────

let privateKey: string | null = null;
let publicKey: string | null = null;

function resolveKeyFile(rawPath: string): string {
  const candidates = [
    rawPath,
    path.resolve(process.cwd(), rawPath),
    path.resolve(process.cwd(), 'apps/api', rawPath),
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) {
    throw new Error(`RSA Key file not found at ${rawPath}. Checked: ${candidates.join(', ')}`);
  }
  return fs.readFileSync(found, 'utf-8');
}

function getPrivateKey(): string {
  if (!privateKey) privateKey = resolveKeyFile(env.JWT_PRIVATE_KEY_PATH);
  return privateKey;
}

function getPublicKey(): string {
  if (!publicKey) publicKey = resolveKeyFile(env.JWT_PUBLIC_KEY_PATH);
  return publicKey;
}

// ─────────────────────────────────────────────────────────────
// Token helpers
// ─────────────────────────────────────────────────────────────

function signAccessToken(payload: { sub: string; role: string; name: string }): string {
  return jwt.sign(payload, getPrivateKey(), {
    algorithm: 'RS256',
    expiresIn: env.JWT_ACCESS_EXPIRY as any,
  });
}

function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ─────────────────────────────────────────────────────────────
// Auth Service
// ─────────────────────────────────────────────────────────────

export const authService = {
  // ── Register (email/password) ─────────────────────────────
  async register(dto: RegisterDto) {
    const existingPhone = await authRepository.findUserByPhone(dto.phone);
    if (existingPhone) {
      throw createApiError({
        status: 409,
        code: 'PHONE_EXISTS',
        title: 'Conflict',
        detail: 'An account with this phone number already exists.',
      });
    }

    if (dto.email) {
      const existingEmail = await authRepository.findUserByEmail(dto.email);
      if (existingEmail) {
        throw createApiError({
          status: 409,
          code: 'EMAIL_EXISTS',
          title: 'Conflict',
          detail: 'An account with this email already exists.',
        });
      }
    }

    const passwordHash = dto.password
      ? await argon2.hash(dto.password, {
          type: argon2.argon2id,
          memoryCost: 65536,
          timeCost: 3,
          parallelism: 4,
        })
      : undefined;

    const user = await authRepository.createUser({
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      passwordHash,
      role: dto.role as Role,
    });

    if (dto.role === 'SHOPKEEPER') {
      try {
        await shopRepository.ensureShopForUser(user.id);
      } catch (e) {
        // Log but don't fail registration
        console.error('Failed to create default shop:', e);
      }
    }

    return { userId: user.id, message: 'Account created. Verify your phone to continue.' };
  },

  // ── Login (email/password) ────────────────────────────────
  async login(dto: LoginDto, meta: { userAgent?: string; ipAddress?: string }) {
    const raw = dto.identifier.trim();
    const isEmail = raw.includes('@');
    let user = null;

    if (isEmail) {
      user = await authRepository.findUserByEmail(raw);
    } else {
      const candidates = [raw];
      if (/^[6-9]\d{9}$/.test(raw)) {
        candidates.push(`+91${raw}`);
      } else if (raw.startsWith('+91')) {
        candidates.push(raw.slice(3));
      }

      for (const phone of candidates) {
        user = await authRepository.findUserByPhone(phone);
        if (user) break;
      }
    }

    if (!user || !user.passwordHash) {
      throw createApiError({
        status: 401,
        code: 'INVALID_CREDENTIALS',
        title: 'Unauthorized',
        detail: 'Invalid phone/email or password.',
      });
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw createApiError({
        status: 401,
        code: 'INVALID_CREDENTIALS',
        title: 'Unauthorized',
        detail: 'Invalid phone/email or password.',
      });
    }

    return authService._issueTokens(user, meta);
  },

  // ── OTP Request ───────────────────────────────────────────
  async requestOtp(dto: RequestOtpDto) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await authRepository.findUserByPhone(dto.phone);
    await authRepository.createOtpToken({
      phone: dto.phone,
      otpHash,
      purpose: dto.purpose,
      expiresAt,
      userId: user?.id,
    });

    // In production: send via MSG91/Twilio
    // In dev: log to console (never expose in production logs)
    if (env.NODE_ENV !== 'production') {
      console.info(`[DEV] OTP for ${dto.phone}: ${otp}`);
    }

    return { message: 'OTP sent successfully.', expiresIn: 600 };
  },

  // ── OTP Verify ────────────────────────────────────────────
  async verifyOtp(dto: VerifyOtpDto, meta: { userAgent?: string; ipAddress?: string }) {
    const record = await authRepository.findValidOtp(dto.phone, dto.purpose);
    if (!record) {
      throw createApiError({
        status: 401,
        code: 'OTP_INVALID',
        title: 'Unauthorized',
        detail: 'OTP is invalid or expired.',
      });
    }

    const match = await bcrypt.compare(dto.otp, record.otpHash);
    if (!match) {
      await authRepository.incrementOtpAttempts(record.id);
      throw createApiError({
        status: 401,
        code: 'OTP_INVALID',
        title: 'Unauthorized',
        detail: 'OTP is incorrect.',
      });
    }

    await authRepository.markOtpUsed(record.id);

    let user = await authRepository.findUserByPhone(dto.phone);
    if (!user) {
      // Auto-create customer on first OTP login
      user = await authRepository.createUser({
        name: dto.phone,
        phone: dto.phone,
        role: 'CUSTOMER' as Role,
      });
    }

    if (!user.isVerified) {
      await authRepository.updateUser(user.id, { isVerified: true });
    }

    return authService._issueTokens(user, meta);
  },

  // ── Refresh ───────────────────────────────────────────────
  async refresh(rawToken: string, meta: { userAgent?: string; ipAddress?: string }) {
    const tokenHash = hashToken(rawToken);
    const record = await authRepository.findRefreshToken(tokenHash);

    if (!record) {
      throw createApiError({
        status: 401,
        code: 'TOKEN_INVALID',
        title: 'Unauthorized',
        detail: 'Refresh token not found.',
      });
    }

    // Reuse detection: if token is already revoked, revoke the whole family
    if (record.isRevoked || record.expiresAt < new Date()) {
      await authRepository.revokeTokenFamily(record.family);
      throw createApiError({
        status: 401,
        code: 'TOKEN_REUSE',
        title: 'Unauthorized',
        detail: 'Possible token theft detected. Please log in again.',
      });
    }

    // Rotate: revoke old, issue new
    await authRepository.revokeRefreshToken(record.id);
    const user = await authRepository.findUserById(record.userId);
    if (!user || !user.isActive) {
      throw createApiError({
        status: 401,
        code: 'USER_INACTIVE',
        title: 'Unauthorized',
        detail: 'Account is inactive.',
      });
    }

    return authService._issueTokens(user, meta, record.family);
  },

  // ── Logout ────────────────────────────────────────────────
  async logout(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    const record = await authRepository.findRefreshToken(tokenHash);
    if (record) {
      await authRepository.revokeTokenFamily(record.family);
    }
  },

  // ── Internal: issue access + refresh tokens ───────────────
  async _issueTokens(
    user: { id: string; name: string; role: string },
    meta: { userAgent?: string; ipAddress?: string },
    existingFamily?: string,
  ) {
    const accessToken = signAccessToken({ sub: user.id, role: user.role, name: user.name });

    const rawRefresh = generateOpaqueToken();
    const tokenHash = hashToken(rawRefresh);
    const family = existingFamily ?? uuidv4();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash,
      family,
      expiresAt,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    });

    return { accessToken, rawRefresh, expiresIn: 900 }; // 15 minutes in seconds
  },
};
