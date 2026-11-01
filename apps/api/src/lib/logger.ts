import pino from 'pino';
import { env } from '../config/env.js';

// ─────────────────────────────────────────────────────────────
// Structured JSON logger with PII redaction
// ─────────────────────────────────────────────────────────────

const loggerOptions: pino.LoggerOptions = {
  level: env.NODE_ENV === 'test' ? 'silent' : 'info',
  ...(env.NODE_ENV === 'development'
    ? { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } } }
    : {}),
  redact: {
    paths: [
      'password',
      'passwordHash',
      'token',
      'accessToken',
      'refreshToken',
      'otp',
      'otpHash',
      'authorization',
      'req.headers.authorization',
      'req.headers.cookie',
      'phone',
      'email',
      '*.phone',
      '*.email',
      'address',
      '*.address',
      'card*',
    ],
    censor: '[REDACTED]',
  },
};

export const logger = pino(loggerOptions);
