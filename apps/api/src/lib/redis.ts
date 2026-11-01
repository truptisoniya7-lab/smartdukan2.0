import { Redis } from 'ioredis';
// @ts-expect-error - ioredis-mock has CJS default export
import RedisMock from 'ioredis-mock';
import { env } from '../config/env.js';
import { logger } from './logger.js';

// ─────────────────────────────────────────────────────────────
// Redis Client — single connection for all uses:
// cache, BullMQ, pub/sub, GEO, rate-limiting, sessions
// ─────────────────────────────────────────────────────────────

let redisClient: Redis | null = null;

export function getRedis(): Redis {
  if (!redisClient) {
    if (env.REDIS_URL === 'mock' || env.REDIS_URL === '' || env.REDIS_URL.startsWith('mock:')) {
      logger.info('Using in-memory Redis mock for development');
      redisClient = new (RedisMock as any)() as Redis;
      return redisClient;
    }

    try {
      redisClient = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: null, // required by BullMQ
        enableReadyCheck: true,
        lazyConnect: true,
        retryStrategy(times: number) {
          if (times > 3 && env.NODE_ENV === 'development') {
            return null; // stop retrying
          }
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      redisClient.connect().catch((err) => {
        if (env.NODE_ENV === 'development') {
          logger.warn({ err: String(err) }, 'Redis connection failed; switching to in-memory mock');
          redisClient = new (RedisMock as any)() as Redis;
        }
      });

      redisClient.on('connect', () => logger.info('Redis connected'));
      redisClient.on('error', (err: unknown) => logger.error({ err }, 'Redis error'));
      redisClient.on('close', () => logger.warn('Redis connection closed'));
    } catch {
      logger.warn('Failed to construct Redis client; falling back to mock');
      redisClient = new (RedisMock as any)() as Redis;
    }
  }
  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
