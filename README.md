# elden-js

[![npm version](https://img.shields.io/npm/v/elden-js)](https://www.npmjs.com/package/elden-js)
[![License](https://img.shields.io/npm/l/elden-js)](LICENSE)

**Lightweight library to protect frontend routes and rate-limit requests in Node.js apps.**

- Protect frontend routes by verifying cookies or tokens (`verifyAccess`).
- Rate-limit requests using Redis (`rateControl`).
- Works with **Next.js**, **Express**, or any Node.js server.

---

## Installation

```
npm install elden-js
```
___

## verifyAccess
Verify access to a route by checking a cookie or token with your backend.

<details> <summary>Usage (Next.js example)</summary>

````
import { verifyAccess, RequestWithCookies, AccessResponse } from "elden-js/frontend";

const typedReq = req as unknown as RequestWithCookies;
// or just pass the plain rrequest [ verifyAccess(backendURL, tokenName, req) ]

const access: AccessResponse = await verifyAccess(
  "http://yourBackend",
  "tokenName",
  typedReq
);

if (!access.accessStatus) {
  // redirect or deny access
}
````

</details> <details> <summary>Returns</summary>

````
{
  accessStatus: boolean, // true if access is allowed
  message: string        // "Access granted" or "Access denied"
}
````

</details>

**Notes:**
- Backend must return ***{ accessStatus: boolean }*** after verifying the token.

- ***{ message: string }*** is optional but can provide context.
___

## rateControl

Limit the number of requests per IP using Redis.

<details> <summary>Usage (Node.js/Express example)</summary>

````
import { rateControl, RateControlRequest, RateLimitResult, RateLimitOptions } from "elden-js/backend";

const options: RateLimitOptions = { limit: 5, window: 10 }; // 5 requests per 10 seconds
// options can have redisHost, redisPort, redisPassword which are optional
// read Configuration for more info on RateLimitOptions

// can just pass the plain request, typedRequest is optional
// const typedReq: RateControlRequest = { ip: req.ip (or) headers: req.headers };

const result: RateLimitResult = await rateControl(req, options);

if (!result.allowed) {
  // handle rate limit exceeded
}

// if redis is not connected it will return an error: true
if (result.error) {
// console.error("Redis not connected")
}
````

</details> <details> <summary>Configuration</summary>

````
export interface RateLimitOptions {
  limit: number;       // max number of allowed requests per IP
  window: number;      // in seconds example 10 for 10 seconds
  redisHost?: string;  // your live redis host url, if not provided runs on 127.0.0.1(localHost)
  redisPort?: number;  // if not provided runs on 6379
  redisPassword?: string;
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
  error?: boolean     // true if Redis not connected
}
````

</details>

**Notes:**

- Requires a running Redis server.

- Optional Redis settings: redisHost, redisPort, redisPassword.

- If Redis is unavailable, ***error: true*** is returned so you can handle it manually.
___

## Summary

- Minimal setup: just pass the request and required options.

- ***rateControl*** works in any Node.js server, ***verifyAccess*** is supposed to work on frontend middlewares

- Provides frontend route protection and IP rate limiting with simple configuration for Node.js.
___

**Contact:** For questions or suggestions: `jebesh67@gmail.com`
___