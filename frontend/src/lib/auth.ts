/**
 * Auth token helpers — keep localStorage and the `cms_token` cookie in sync.
 * The cookie is used by middleware (server-side) to protect routes.
 * localStorage is used by apiRequest for Bearer headers.
 */

const COOKIE_NAME = 'cms_token';
const DEMO_COOKIE_NAME = 'cms_demo_token';

export function setAuthToken(token: string, isDemo = false, refreshToken?: string) {
    const key = isDemo ? 'demo_token' : 'token';
    const cookie = isDemo ? DEMO_COOKIE_NAME : COOKIE_NAME;

    localStorage.setItem(key, token);
    // Access token cookie — short lived (15m), matching backend access-token TTL.
    // Middleware only needs a "is this user logged in right now" signal; the
    // refresh interceptor in api.ts keeps the cookie fresh via /auth/refresh.
    document.cookie = `${cookie}=${token}; path=/; max-age=${15 * 60}; SameSite=Lax`;

    // Refresh token lives in localStorage only — never in a cookie, because
    // the middleware has no business using it and it should not be sent on
    // every request.
    if (refreshToken && !isDemo) {
        localStorage.setItem('refresh_token', refreshToken);
    }
}

export function clearAuthToken(isDemo = false) {
    const key = isDemo ? 'demo_token' : 'token';
    const cookie = isDemo ? DEMO_COOKIE_NAME : COOKIE_NAME;

    localStorage.removeItem(key);
    if (!isDemo) {
        localStorage.removeItem('user');
        localStorage.removeItem('refresh_token');
    }

    // Expire the cookie immediately
    document.cookie = `${cookie}=; path=/; max-age=0; SameSite=Lax`;
}
