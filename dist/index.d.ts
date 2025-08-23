interface AccessResponse {
    accessStatus: boolean;
    message: string;
}
/**
 * Server-side access verification
 * Only needs the cookie value, no framework dependencies
 */
declare const verifyAccess: (backendURL: string, cookieName: string, cookieValue: string) => Promise<AccessResponse>;

export { type AccessResponse, verifyAccess };
