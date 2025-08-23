interface AccessResponse {
    accessStatus: boolean;
    message: string;
}
interface RequestWithCookies {
    cookies: {
        get: (name: string) => {
            value: string;
        } | undefined;
    };
}
/**
 * Generic server-side access verification
 * Works with any server framework that has req.cookies.get()
 */
declare const verifyAccess: (backendURL: string, cookieName: string, req: RequestWithCookies) => Promise<AccessResponse>;

export { type AccessResponse, type RequestWithCookies, verifyAccess };
