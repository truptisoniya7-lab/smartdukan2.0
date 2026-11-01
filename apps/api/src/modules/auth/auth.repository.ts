import { prisma } from '../../lib/prisma.js';
import type { Role } from '@smart-dukan/shared';

// ─────────────────────────────────────────────────────────────
// Auth Repository — database access for auth operations
// ─────────────────────────────────────────────────────────────

export const authRepository = {
  async findUserByPhone(phone: string) {
    return prisma.user.findUnique({ where: { phone } });
  },

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  async findUserById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  async createUser(data: {
    name: string;
    phone: string;
    email?: string;
    passwordHash?: string;
    role: Role;
  }) {
    return prisma.user.create({ data });
  },

  async updateUser(id: string, data: Partial<{ isVerified: boolean; passwordHash: string }>) {
    return prisma.user.update({ where: { id }, data });
  },

  // ── OTP ──────────────────────────────────────────────────

  async createOtpToken(data: {
    phone: string;
    otpHash: string;
    purpose: string;
    expiresAt: Date;
    userId?: string;
  }) {
    return prisma.otpToken.create({ data });
  },

  async findValidOtp(phone: string, purpose: string) {
    return prisma.otpToken.findFirst({
      where: {
        phone,
        purpose,
        used: false,
        expiresAt: { gt: new Date() },
        attempts: { lt: 5 },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async markOtpUsed(id: string) {
    return prisma.otpToken.update({ where: { id }, data: { used: true } });
  },

  async incrementOtpAttempts(id: string) {
    return prisma.otpToken.update({ where: { id }, data: { attempts: { increment: 1 } } });
  },

  // ── Refresh Tokens ────────────────────────────────────────

  async createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    family: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }) {
    return prisma.refreshToken.create({ data });
  },

  async findRefreshToken(tokenHash: string) {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  },

  async revokeRefreshToken(id: string) {
    return prisma.refreshToken.update({ where: { id }, data: { isRevoked: true } });
  },

  async revokeTokenFamily(family: string) {
    return prisma.refreshToken.updateMany({ where: { family }, data: { isRevoked: true } });
  },
};
