"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  verifyAccess: () => verifyAccess
});
module.exports = __toCommonJS(index_exports);

// src/utils/verifyAccess.ts
var verifyAccess = async (backendURL, cookieName, req) => {
  try {
    const cookieValue = req.cookies.get(cookieName)?.value || "";
    console.log(cookieValue);
    const res = await fetch(backendURL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${cookieName}=${cookieValue}`
      }
    });
    if (!res.ok) {
      return { accessStatus: false, message: "Access denied" };
    }
    const data = await res.json();
    return {
      accessStatus: !!data.accessStatus,
      message: data.message || (data.accessStatus ? "Access granted" : "Access denied")
    };
  } catch (err) {
    console.error("verifyAccess error:", err);
    return {
      accessStatus: false,
      message: "Access denied due to server error"
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  verifyAccess
});
