import { z } from 'zod';

// ─── Register ────────────────────────────────────────────────
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z
    .string()
    .regex(/^\+91[6-9]\d{9}$/, 'Enter a valid Indian mobile number (+91XXXXXXXXXX)'),
  email: z.string().email().optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .optional(),
  role: z.enum(['CUSTOMER', 'SHOPKEEPER', 'RIDER']).default('CUSTOMER'),
});

export type RegisterDto = z.infer<typeof registerSchema>;

// ─── Login ───────────────────────────────────────────────────
export const loginSchema = z.object({
  identifier: z.string().min(1, 'Phone or email is required'), // phone or email
  password: z.string().min(1, 'Password is required'),
});

export type LoginDto = z.infer<typeof loginSchema>;

// ─── OTP Request ─────────────────────────────────────────────
export const requestOtpSchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid phone number'),
  purpose: z.enum(['LOGIN', 'REGISTER', 'DELIVERY_VERIFY']),
});

export type RequestOtpDto = z.infer<typeof requestOtpSchema>;

// ─── OTP Verify ──────────────────────────────────────────────
export const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid phone number'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/),
  purpose: z.enum(['LOGIN', 'REGISTER', 'DELIVERY_VERIFY']),
});

export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;

// ─── Refresh Token ───────────────────────────────────────────
export const refreshTokenSchema = z.object({
  // refresh token comes from httpOnly cookie, not body
  // this schema validates any optional body params
});

// ─── Auth Responses ──────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  expiresIn: number; // seconds
}

export interface UserPayload {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
}
