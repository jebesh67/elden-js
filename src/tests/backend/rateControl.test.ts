import { rateControl, RateControlRequest, RateLimitOptions, RateLimitResult } from "../../utils/backend/rateControl";

const incrMock = jest.fn();
const ttlMock = jest.fn();
const expireMock = jest.fn();
const pingMock = jest.fn();
const onMock = jest.fn();

jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => ({
    incr: incrMock,
    ttl: ttlMock,
    expire: expireMock,
    ping: pingMock,
    on: onMock,
  }));
});

describe("rateControl", () => {
  let options: RateLimitOptions;
  
  beforeEach(() => {
    options = {
      limit: 2,
      window: 10,
      trustProxy: false,
    };
    
    incrMock.mockReset();
    ttlMock.mockReset();
    expireMock.mockReset();
    pingMock.mockReset();
    onMock.mockReset();
  });
  
  it("should return error when IP is undefined", async () => {
    const req: RateControlRequest = { headers: {} };
    
    const result: RateLimitResult = await rateControl(req, options);
    
    expect(result.allowed).toBe(false);
    expect(result.error).toBe(true);
    expect(result.ip).toBe("unknown");
    expect(result.message).toBe("IP is undefined, cannot apply rate limiting");
  });
  
  it("should allow a request under the limit", async () => {
    const req: RateControlRequest = { headers: { "x-forwarded-for": "1.2.3.4" } };
    
    pingMock.mockResolvedValue("PONG");
    incrMock.mockResolvedValue(1);
    ttlMock.mockResolvedValue(9);
    expireMock.mockResolvedValue(1);
    
    const result: RateLimitResult = await rateControl(req, options);
    
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
    expect(result.resetIn).toBe(9);
    expect(result.ip).toBe("1.2.3.4");
  });
  
  it("should return allowed: false when over the limit", async () => {
    const req: RateControlRequest = { headers: { "x-forwarded-for": "1.2.3.4" } };
    
    pingMock.mockResolvedValue("PONG");
    incrMock.mockResolvedValue(3); // over limit
    ttlMock.mockResolvedValue(5);
    
    const result: RateLimitResult = await rateControl(req, options);
    
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.resetIn).toBe(5);
    expect(result.message).toMatch(/Rate limit exceeded/);
  });
  
  it("should handle Redis errors gracefully", async () => {
    const req: RateControlRequest = { headers: { "x-forwarded-for": "1.2.3.4" } };
    
    pingMock.mockRejectedValue(new Error("Redis down"));
    
    const result: RateLimitResult = await rateControl(req, options);
    
    expect(result.allowed).toBe(false);
    expect(result.error).toBe(true);
    expect(result.ip).toBe("1.2.3.4");
    expect(result.message).toBe("Redis not connected, rate limiting unavailable");
  });
  
  it("should use req.ip when provided", async () => {
    const req: RateControlRequest = { ip: "9.8.7.6", headers: {} };
    
    pingMock.mockResolvedValue("PONG");
    incrMock.mockResolvedValue(1);
    ttlMock.mockResolvedValue(10);
    expireMock.mockResolvedValue(1);
    
    const result: RateLimitResult = await rateControl(req, options);
    
    expect(result.ip).toBe("9.8.7.6");
    expect(result.allowed).toBe(true);
  });
  
  it("should use headers['x-forwarded-for'] when ip is not provided", async () => {
    const req: RateControlRequest = { headers: { "x-forwarded-for": "1.2.3.4" } };
    
    pingMock.mockResolvedValue("PONG");
    incrMock.mockResolvedValue(1);
    ttlMock.mockResolvedValue(10);
    expireMock.mockResolvedValue(1);
    
    const result: RateLimitResult = await rateControl(req, options);
    
    expect(result.ip).toBe("1.2.3.4");
    expect(result.allowed).toBe(true);
  });
  
  it("should use the first IP from x-forwarded-for when multiple are provided, even if req.ip exists", async () => {
    const req: RateControlRequest = {
      ip: "9.8.7.6",
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    };
    
    pingMock.mockResolvedValue("PONG");
    incrMock.mockResolvedValue(1);
    ttlMock.mockResolvedValue(10);
    expireMock.mockResolvedValue(1);
    
    const result: RateLimitResult = await rateControl(req, options);
    
    expect(result.ip).toBe("1.2.3.4");
    expect(result.allowed).toBe(true);
  });
  
  it("should use req.ip or socket.remoteAddress when trustProxy is true, ignoring x-forwarded-for", async () => {
    const req: RateControlRequest = {
      ip: "9.8.7.6",
      socket: { remoteAddress: "10.0.0.1" } as any,
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    };
    
    options.trustProxy = true;
    
    pingMock.mockResolvedValue("PONG");
    incrMock.mockResolvedValue(1);
    ttlMock.mockResolvedValue(10);
    expireMock.mockResolvedValue(1);
    
    const result: RateLimitResult = await rateControl(req, options);
    
    expect(result.ip).toBe("9.8.7.6");
    expect(result.allowed).toBe(true);
    
    const req2: RateControlRequest = {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
      socket: { remoteAddress: "10.0.0.1" } as any,
    };
    
    const result2: RateLimitResult = await rateControl(req2, options);
    expect(result2.ip).toBe("10.0.0.1");
    expect(result2.allowed).toBe(true);
  });
  
  
});
