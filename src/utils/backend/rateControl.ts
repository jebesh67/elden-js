import Redis from "ioredis";
import { Socket } from "net";

export interface RateControlRequest {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
  socket?: Socket;
}

export interface RateLimitOptions {
  limit: number;
  window: number;
  redisHost?: string;
  redisPort?: number;
  redisPassword?: string;
  trustProxy?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
  ip: string;
  message: string;
  error?: boolean;
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

const getClientIP = (req: RateControlRequest, trustProxy?: boolean): string => {
  if (trustProxy) {
    if (req.ip) return req.ip;
    if (req.socket?.remoteAddress) return req.socket.remoteAddress;
  } else {
    const xForwardedFor = req.headers["x-forwarded-for"];
    if (typeof xForwardedFor === "string") {
      const ip = xForwardedFor.split(",")[0].trim();
      if (ip) return ip;
    } else if (Array.isArray(xForwardedFor) && xForwardedFor.length > 0) {
      return xForwardedFor[0].trim();
    }
    
    if (req.ip) return req.ip;
    if (req.socket?.remoteAddress) return req.socket.remoteAddress;
  }
  
  return "unknown";
};


export const rateControl = async (
  req: RateControlRequest,
  options: RateLimitOptions
): Promise<RateLimitResult> => {
  const ip = getClientIP(req, options.trustProxy);
  
  if (!ip || ip === "unknown") {
    return {
      allowed: false,
      remaining: 0,
      resetIn: 0,
      ip: "unknown",
      error: true,
      message: "IP is undefined, cannot apply rate limiting",
    };
  }
  
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

