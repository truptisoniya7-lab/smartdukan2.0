import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'node:http';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { connectDB, disconnectDB } from './lib/prisma.js';
import { getRedis, disconnectRedis } from './lib/redis.js';
import { requestId } from './middleware/requestId.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authRouter } from './modules/auth/auth.router.js';
import { shopRouter } from './modules/shop/shop.router.js';
import { catalogRouter } from './modules/catalog/catalog.router.js';
import { inventoryRouter } from './modules/inventory/inventory.router.js';

// ─────────────────────────────────────────────────────────────
// App factory
// ─────────────────────────────────────────────────────────────

export function createApp() {
  const app = express();

  // ── Security headers ────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'"],
          workerSrc: ["'self'", 'blob:'],
          frameAncestors: ["'none'"],
        },
      },
      hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
    }),
  );

  // ── CORS ─────────────────────────────────────────────────────
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Request-Id'],
    }),
  );

  // ── Parsing ───────────────────────────────────────────────────
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());

  // ── Request tracking ──────────────────────────────────────────
  app.use(requestId);

  // ── Health checks ─────────────────────────────────────────────
  app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

  app.get('/readyz', async (_req, res) => {
    try {
      const { prisma } = await import('./lib/prisma.js');
      await prisma.$queryRaw`SELECT 1`;
      const redis = getRedis();
      await redis.ping();
      res.json({ status: 'ok', db: 'ok', redis: 'ok' });
    } catch (err) {
      res.status(503).json({ status: 'error', detail: String(err) });
    }
  });

  // ── API routes ────────────────────────────────────────────────
  const api = express.Router();
  api.use('/auth', authRouter);
  api.use('/shops', shopRouter);
  api.use('/', catalogRouter);
  api.use('/shop/inventory', inventoryRouter);

  app.use('/api/v1', api);

  // ── 404 + error handler (must be last) ───────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

// ─────────────────────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────────────────────

async function bootstrap() {
  const app = createApp();
  const httpServer = createServer(app);

  // Connect to data stores
  await connectDB();
  logger.info('PostgreSQL connected');

  getRedis(); // initialises the Redis client
  logger.info('Redis client initialised');

  httpServer.listen(env.PORT, () => {
    logger.info(`🚀 Smart Dukan API running on http://localhost:${env.PORT}`);
    logger.info(`   Environment: ${env.NODE_ENV}`);
  });

  // ── Graceful shutdown ────────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    httpServer.close(async () => {
      await disconnectDB();
      await disconnectRedis();
      logger.info('Shutdown complete');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception');
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled rejection');
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
