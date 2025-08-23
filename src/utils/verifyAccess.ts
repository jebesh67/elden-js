export interface AccessResponse {
  accessStatus: boolean;
  message: string;
}

/**
 * Server-side access verification
 * Only needs the cookie value, no framework dependencies
 */
export const verifyAccess = async (
  backendURL: string,
  cookieName: string,
  cookieValue: string
): Promise<AccessResponse> => {
  try {
    const res = await fetch(backendURL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Cookie-Name": cookieName,
        "X-Cookie-Value": cookieValue,
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
