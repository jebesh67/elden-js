import { verifyAccess, RequestWithCookies, AccessResponse } from "../../utils/frontend/verifyAccess";

global.fetch = jest.fn();

describe("verifyAccess", () => {
  const backendURL = "http://mock-backend";
  const cookieName = "authToken";
  
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });
  
  it("should return access denied when cookie is missing", async () => {
    const req: RequestWithCookies = { cookies: { get: () => undefined } };
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
    });
    
    const result: AccessResponse = await verifyAccess(backendURL, cookieName, req);
    
    expect(result.accessStatus).toBe(false);
    expect(result.message).toBe("Access denied");
    expect(global.fetch).toHaveBeenCalledWith(backendURL, expect.objectContaining({
      method: "GET",
      headers: expect.objectContaining({
        Cookie: `${cookieName}=`
      })
    }));
  });
  
  it("should return access granted when backend responds positively", async () => {
    const req: RequestWithCookies = { cookies: { get: () => ({ value: "token123" }) } };
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ accessStatus: true, message: "Welcome" }),
    });
    
    const result: AccessResponse = await verifyAccess(backendURL, cookieName, req);
    
    expect(result.accessStatus).toBe(true);
    expect(result.message).toBe("Welcome");
  });
  
  it("should return access denied when backend responds negatively", async () => {
    const req: RequestWithCookies = { cookies: { get: () => ({ value: "token123" }) } };
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ accessStatus: false }),
    });
    
    const result: AccessResponse = await verifyAccess(backendURL, cookieName, req);
    
    expect(result.accessStatus).toBe(false);
    expect(result.message).toBe("Access denied");
  });
  
  it("should return default messages if backend does not provide message", async () => {
    const req: RequestWithCookies = { cookies: { get: () => ({ value: "token123" }) } };
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ accessStatus: true }),
    });
    
    const result: AccessResponse = await verifyAccess(backendURL, cookieName, req);
    expect(result.message).toBe("Access granted");
  });
  
  it("should handle fetch throwing an error", async () => {
    const req: RequestWithCookies = { cookies: { get: () => ({ value: "token123" }) } };
    
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));
    
    const result: AccessResponse = await verifyAccess(backendURL, cookieName, req);
    
    expect(result.accessStatus).toBe(false);
    expect(result.message).toBe("Access denied due to server error");
  });
  
  it("should include the correct cookie value in request headers", async () => {
    const req: RequestWithCookies = { cookies: { get: () => ({ value: "abc123" }) } };
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ accessStatus: true }),
    });
    
    await verifyAccess(backendURL, cookieName, req);
    
    expect(global.fetch).toHaveBeenCalledWith(
      backendURL,
      expect.objectContaining({
        headers: expect.objectContaining({
          Cookie: "authToken=abc123",
        }),
      })
    );
  });
});
