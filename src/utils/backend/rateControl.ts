import Redis from "ioredis";

export interface RateLimitOptions {
  limit: number;
  window: number;
  redisHost?: string;
  redisPort?: number;
  redisPassword?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
  ip: string;
  message: string;
  error?: boolean;
}

export interface RateControlRequest {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
}

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
  req: RateControlRequest,
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
    
    await r.ping();
    
    const requests = await r.incr(key);
    if (requests === 1) {
      await r.expire(key, window);
    }
    
    const ttl = await r.ttl(key);
    
    if (requests > limit) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: ttl,
        ip,
        message: `Rate limit exceeded. Try again in ${ttl} seconds.`,
      };
    }
    
    return {
      allowed: true,
      remaining: limit - requests,
      resetIn: ttl,
      ip,
      message: "Request allowed.",
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
