import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { registerSchema, loginSchema, requestOtpSchema, verifyOtpSchema } from '@smart-dukan/shared';
import { authenticate } from '../../middleware/auth.js';

// ─────────────────────────────────────────────────────────────
// Auth Router — /api/v1/auth
// ─────────────────────────────────────────────────────────────

const router = Router();

// Public endpoints
router.post('/register', validate({ body: registerSchema }), authController.register);
router.post('/login', validate({ body: loginSchema }), authController.login);
router.post('/otp/request', validate({ body: requestOtpSchema }), authController.requestOtp);
router.post('/otp/verify', validate({ body: verifyOtpSchema }), authController.verifyOtp);
router.post('/refresh', authController.refresh);

// Authenticated endpoints
router.post('/logout', authenticate, authController.logout);

export { router as authRouter };
