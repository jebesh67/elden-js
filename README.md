**elden-js**
* A lightweight library to protect frontend routes in Node.js apps by verifying cookies or tokens on the server.

* Works with Next.js, Express, or any Node.js server.

-----------------------------------------------------------------------------

**Installation**
npm install elden-js

-----------------------------------------------------------------------------

**Usage**
Protect a frontend route (Next.js middleware example)
import { NextRequest, NextResponse } from "next/server";
import { verifyAccess, RequestWithCookies } from "elden-js";

const protectedPaths = ["/yourPage"];
const backendURL = "http://yourBackend";
const cookieName = "yourCookieName";

export async function middleware(req: NextRequest) {
  if (protectedPaths.some(path => req.nextUrl.pathname.startsWith(path))) {
    // the TypeScript type comes with the package
    const typedReq = req as unknown as RequestWithCookies;

    // *the backend should return accessStatus: true || false*
    const access = await verifyAccess(backendURL, cookieName, typedReq);

    if (!access.accessStatus) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/yourPage/:path*"],
};

-----------------------------------------------------------------------------

**Returned Data**
*verifyAccess returns a promise with the following structure:*

interface AccessResponse {
  accessStatus: boolean; // true if access is allowed, false if denied
  message: string;       // explanatory message ("Access granted" or "Access denied")
}

-----------------------------------------------------------------------------

**Example:**
const access = await verifyAccess(backendURL, "token", typedReq);

console.log(access.accessStatus); *// true or false*
console.log(access.message);      *// "Access granted" or "Access denied"*

-----------------------------------------------------------------------------

**Note**
* Works with any server framework that has req.cookies.get()

* Cookies containing the token are sent automatically to your backend. On the server, you can read the cookie value depending on your framework:

  - **Express:** `const token = req.cookies['token'];`
  - Validate the token in your backend and return the json() as mentioned below

* Backend should always return accessStatus: boolean value as json();

* You can also send a message as json which is optional

-----------------------------------------------------------------------------

**Summary**
* Protect frontend routes easily by verifying cookies server-side.

* Minimal setup: just provide the *backend url + cookie name + request object*.

* Works anywhere in Node.js — Next.js, Express, or custom servers.

* Hoping to make more updates and support more complex data and keep things simplified

* Email me at **jebesh67@gmail.com** for queries and suggestions

-----------------------------------------------------------------------------
