/**
 * Auth token helpers — keep localStorage and the `cms_token` cookie in sync.
 * The cookie is used by middleware (server-side) to protect routes.
 * localStorage is used by apiRequest for Bearer headers.
 */

const COOKIE_NAME = 'cms_token';

export function setAuthToken(token: string) {
    localStorage.setItem('token', token);
    // 7-day expiry; SameSite=Lax is safe for same-origin navigation
    document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}

export function clearAuthToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Expire the cookie immediately
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
