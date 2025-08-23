// elden-js.ts
export interface AccessResponse {
  accessStatus: boolean;
  message: string;
}

export interface RequestWithCookies {
  cookies: {
    get: (name: string) => { value: string } | undefined;
  };
}

/**
 * Generic server-side access verification
 * Works with any server framework that has req.cookies.get()
 */
export const verifyAccess = async (
  backendURL: string,
  cookieName: string,
  req: RequestWithCookies
): Promise<AccessResponse> => {
  try {
    const cookieValue = req.cookies.get(cookieName)?.value || "";
    console.log(cookieValue);

    const res = await fetch(backendURL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${cookieName}=${cookieValue}`,
      },
    });

    if (!res.ok) {
      return { accessStatus: false, message: "Access denied" };
    }

    const data = await res.json();

    return {
      accessStatus: !!data.accessStatus,
      message:
        data.message ||
        (data.accessStatus ? "Access granted" : "Access denied"),
    };
  } catch (err) {
    console.error("verifyAccess error:", err);
    return {
      accessStatus: false,
      message: "Access denied due to server error",
    };
  }
};
