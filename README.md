# elden-js

[![npm version](https://img.shields.io/npm/v/elden-js)](https://www.npmjs.com/package/elden-js)
[![License](https://img.shields.io/npm/l/elden-js)](LICENSE)

**Lightweight library to protect frontend routes and rate-limit requests in Node.js apps.**

- Protect frontend routes by verifying cookies or tokens (`verifyAccess`).
- Rate-limit requests using Redis (`rateControl`).
- Works with **Next.js**, **Express**, or any Node.js server.
- Fully tested with **Jest**.
- Documentation: [elden-js-docs.vercel.app](https://elden-js-docs.vercel.app)

---

## Installation

```bash 
  npm install elden-js
```
___

## Frontend: `verifyAccess`
Verify access to a route by checking a cookie or token with your backend.

<details> <summary>Usage (Next.js example)</summary>

````
import { NextRequest, NextResponse } from "next/server";
import { RequestWithCookies, verifyAccess, AccessResponse } from "elden-js/frontend";

// Example backend URL and token/cookie name
const backendURL = "https://yourBackendURL";
const tokenName = "yourTokenName";

export async function middleware(req: NextRequest): Promise<NextResponse> {
  // Optional TypeScript typing: cast request to RequestWithCookies
  // You can also just pass 'req' directly without casting
  const typedReq = req as unknown as RequestWithCookies;
  // Example without typing:
  // const access: AccessResponse = await verifyAccess(backendURL, tokenName, req);

  const access: AccessResponse = await verifyAccess(backendURL, tokenName,typedReq);

  if (!access.accessStatus) {
    // redirect if access denied
    return NextResponse.redirect(new URL("/redirected-path", req.url));
  }

  // access allowed
  return NextResponse.next();
}

// apply to routes
export const config = {
  matcher: ["/protected/:path*"],
}
````
</details>

<details> <summary>Usage (handling in Express backend)</summary>

````
export const checkAccess = (req: Request, res: Response) => {
  try {
    const token = req.cookies["YourTokenName"];

    if (!token) {
      return res.status(401).json({accessStatus: false, message:"No token provided" });
    }

    const payload = verifyJwt(token);
    if (!payload) {
      return res.status(403).json({accessStatus: false, message:"Invalid token" });
    }

    return res.json({accessStatus: true, message:"Access granted", payload });
  } catch (err) {
      console.error("checkAuth error:", err);
      return res.status(500).json({accessStatus: false, message:"Server error" });
  }
};
````
</details>

<details> <summary>Returns</summary>

````
{
  accessStatus: boolean, // true if access is allowed
  message: string        // "Access granted" or "Access denied"
}
````

</details>

**Notes:**
- Backend must return `{ accessStatus: boolean }` after verifying the token.

- `{ message: string }` is optional but can provide context.
- If any error occurs while fetching from the backend, access will be denied.

**Tested with Jest**

All `verifyAccess` logic is fully tested, including:

- Cookie/token handling:
    - When the cookie is missing, access is denied.
    - When the cookie is present, the backend response determines access.
    - Default messages are returned if the backend does not provide a message.
    - Correct cookie values are sent in request headers.

- Backend responses:
    - Successful verification returns `{ accessStatus: true, message: "Access granted" }`.
    - Denied verification returns `{ accessStatus: false, message: "Access denied" }`.
    - Server or network errors return `{ accessStatus: false, message: "Access denied due to server error" }`.

Example of Jest tests:
```
expect(access.accessStatus).toBe(true);   // access granted
expect(access.accessStatus).toBe(false);  // access denied
expect(access.message).toBe("Access denied due to server error"); // server/network error

```
___

## Backend: `rateControl`

Limit the number of requests per IP using Redis.

<details> <summary>Usage (Node.js/Express example)</summary>

````
import express, { Request, Response, NextFunction } from "express";
import { rateControl, RateLimitOptions, RateLimitResult, RateControlRequest } from "elden-js/backend";

const app = express();

// Enable trust proxy for Express, or rateControl gets the first IP from X-Forwarded-For
// If your app is behind a load balancer or reverse proxy that sets X-Forwarded-For,
// setting trust proxy to true ensures req.ip uses the client’s actual IP.
// If X-Forwarded-For is missing, req.ip will fall back to the direct socket IP.
app.set("trust proxy", true);


const options: RateLimitOptions = {
  limit: 20, // max 20 requests
  window: 10, // per 10 seconds
  redisHost: "yourLiveRedisServer", // optional, default: 127.0.0.1
  redisPort: 6379, // optional, default: 6379
  redisPassword: "yourPassword", // optional
  trustProxy: true, // if true uses socket.remoteAddress instead of x-forwarded-for
};

// Convert Express request to RateControlRequest or you can pass the plain express request
const getRateControlReq = (req: Request): RateControlRequest => ({
  ip: req.ip,
  headers: req.headers,
  socket: req.socket,
});

app.use("/api", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rateReq = getRateControlReq(req);
    const result: RateLimitResult = await rateControl(rateReq, options);

    if (!result.allowed) {
      // Rate limit exceeded
      return res.status(429).json(result);
    }

    if (result.error) {
      // Redis not connected, or IP is unknown
      console.warn("rate limiting unavailable");
    }

    // Request allowed
    next();
  } catch (err) {
    console.error("Rate limiting error:", err);
    res.status(500).json({ message: "Rate limiting failed", error: true });
  }
});
````

</details> <details> <summary>Configuration</summary>

````
export interface RateLimitOptions {
  limit: number;       // max allowed requests per IP
  window: number;      // in seconds
  redisHost?: string;  // defaults to 127.0.0.1
  redisPort?: number;  // defaults to 6379
  redisPassword?: string;
  trustProxy?: boolean; // if true, uses socket.remoteAddress instead of x-forwarded-for
}
````



</details> <details> <summary>Returns</summary>

````
export interface RateLimitResult {
  allowed: boolean,   // true if request allowed
  remaining: number,  // requests left in the window
  resetIn: number,    // seconds until window resets
  ip: string,
  message: string,
  error?: boolean     // true if Redis not connected or when IP is unknown
}
````

</details>

**Notes:**

- Regarding trustProxy
  - `rateControl` uses `req.ip` to identify clients for rate limiting.
  - With `trustProxy = true`, `rateControl` will automatically pick the correct client IP.
  - If `trustProxy` is not provided, it will prioritize `X-Forwarded-For` headers over `req.ip`.
  - Ensure your reverse proxy or load balancer sets `X-Forwarded-For` headers correctly.

- You can provide a `typedRequest: RateControlRequest` or just pass the plain `request`.
- Requires a running Redis server.
- Optional Redis settings: `redisHost`, `redisPort`, `redisPassword`.
- If Redis is unavailable, ***error: true*** is returned so you can handle it manually.
- Supports **trustProxy**: if `true`, `socket.remoteAddress` is used instead of `x-forwarded-for`.

**Tested with Jest**

All `rateControl` logic is fully tested, including:

- IP determination:
  - When `req.ip` is provided.
  - When `headers['x-forwarded-for']` is used.
  - When multiple `x-forwarded-for` IPs exist, it picks the first one.
  - When `trustProxy` is true, `socket.remoteAddress` is used.

- Redis handling:
    - Requests under the limit.
    - Requests over the limit.
    - Redis errors are handled gracefully.

Example of Jest tests:
```
expect(result.allowed).toBe(true);  // request under limit
expect(result.allowed).toBe(false); // over limit
expect(result.error).toBe(true);    // Redis down or IP unknown
```
___

## Summary

- Minimal setup
- `verifyAccess` is intended for frontend middlewares, Provides frontend route protection.
- `rateControl` works in any Node.js server, IP rate limiting with simple configuration for Node.js.
___


## Contact

📧 Email: [jebesh67@gmail.com](mailto:jebesh67@gmail.com)  
🐙 GitHub: [jebesh67](https://github.com/jebesh67)

**License:** MIT
___