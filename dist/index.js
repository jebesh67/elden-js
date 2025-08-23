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
export {
  verifyAccess
};
