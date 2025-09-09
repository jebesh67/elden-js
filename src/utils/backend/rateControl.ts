import type { Request } from "express";
import Redis from "ioredis";

type RateLimitOptions = {
  limit: number;
  window: number;
  redisHost?: string;
  redisPort?: number;
  redisPassword?: string;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetIn: number;
  ip: string;
  message: string;
  error?: boolean;
};

let redis: Redis | null = null;

const getRedis = (options: RateLimitOptions): Redis => {
  if (!redis) {
    redis = new Redis({
      host: options.redisHost || "127.0.0.1",
      port: options.redisPort || 6379,
      password: options.redisPassword,
    });
    
    redis.on("error", (err) => {
      console.warn("Redis error:", err);
    });
  }
  return redis;
};

export const rateControl = async (
  req: Request,
  options: RateLimitOptions
): Promise<RateLimitResult> => {
  const ip =
    req.ip ||
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    "unknown";
  
  const { limit, window } = options;
  const key = `rate:${ip}`;
  
  try {
    const r = getRedis(options);
    
    // test Redis connectivity
    await r.ping();
    
    const requests = await r.incr(key);
    if (requests === 1) {
      await r.expire(key, window);
    }
    
    const ttl = await r.ttl(key);
    
    return {
      allowed: requests <= limit,
      remaining: Math.max(limit - requests, 0),
      resetIn: ttl,
      ip,
      message: `Redis connected, rate limiting works`,
    };
  } catch (err) {
    console.warn("Redis not available:", err);
    return {
      allowed: false,
      remaining: 0,
      resetIn: 0,
      ip,
      error: true,
      message: "Redis not connected, rate limiting unavailable",
    };
  }
};
