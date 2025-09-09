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
import { verifyAccess, RequestWithCookies } from "elden-js";

const typedReq = req as unknown as RequestWithCookies;

const access = await verifyAccess(
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
import { rateControl, RateControlRequest, RateLimitOptions } from "elden-js";

const options: RateLimitOptions = { limit: 5, window: 10 }; // 5 requests per 10 seconds
const typedReq: RateControlRequest = { ip: req.ip, headers: req.headers };

const result = await rateControl(typedReq, options);

if (!result.allowed) {
  // handle rate limit exceeded
}
````

</details> <details> <summary>Returns</summary>

````
{
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

- Works anywhere in Node.js — Next.js, Express, or custom servers.

- Provides frontend route protection and IP rate limiting with simple configuration.
___

**Contact:** For questions or suggestions: `jebesh67@gmail.com`
___