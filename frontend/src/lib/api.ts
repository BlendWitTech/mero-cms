export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';

interface RequestOptions {
    method?: HttpMethod;
    body?: any;
    headers?: Record<string, string>;
    skipNotification?: boolean;
    _retry?: boolean; // internal — set after a refresh attempt so we don't loop
}

export function getApiBaseUrl() {
    // Server-side execution (Server Components, route handlers) needs an
    // absolute URL because Node's fetch refuses relative paths. The
    // browser, in contrast, can use the same-origin /api proxy that the
    // Next.js rewrite in next.config.ts forwards to the backend.
    if (typeof window === 'undefined') {
        return (
            process.env.BACKEND_URL ||
            process.env.NEXT_PUBLIC_API_URL ||
            'http://localhost:3001'
        );
    }
    let baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

    // Handle IP-based local dev (demo isolation): swap localhost → 127.0.0.1
    // only when an absolute URL is configured.
    if (
        typeof window !== 'undefined' &&
        window.location.hostname === '127.0.0.1' &&
        baseUrl.startsWith('http')
    ) {
        baseUrl = baseUrl.replace('localhost', '127.0.0.1');
    }
    return baseUrl;
}

// ── Refresh token plumbing ──────────────────────────────────────────────────
// One in-flight refresh at a time — concurrent 401s should share the same
// /auth/refresh call rather than each trying to rotate the token.
let refreshInFlight: Promise<boolean> | null = null;

async function runRefresh(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    const rt = localStorage.getItem('refresh_token');
    if (!rt) return false;
    try {
        const res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: rt }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        if (!data?.access_token || !data?.refresh_token) return false;
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        document.cookie = `cms_token=${data.access_token}; path=/; max-age=${15 * 60}; SameSite=Lax`;
        return true;
    } catch {
        return false;
    }
}

function refreshAccessToken(): Promise<boolean> {
    if (!refreshInFlight) {
        refreshInFlight = runRefresh().finally(() => {
            refreshInFlight = null;
        });
    }
    return refreshInFlight;
}

export async function apiRequest(endpoint: string, options: RequestOptions = {}) {
    const { method = 'GET', body, headers = {}, skipNotification = false, _retry = false } = options;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    try {
        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method,
            headers: { ...defaultHeaders, ...headers },
            body: body ? JSON.stringify(body) : undefined,
        });

        const text = await response.text();
        let data: any = {};
        try {
            data = text ? JSON.parse(text) : {};
        } catch (e) {
            console.error('Failed to parse JSON response:', text);
            if (!response.ok) {
                throw new Error(text || 'An unexpected error occurred');
            }
        }

        if (!response.ok) {
            // 401 Unauthorized — try a silent refresh once, then retry. If
            // the refresh fails or this was already a retry, clear session
            // and bounce to login — but ONLY from a protected page. If the
            // user is already on the login/setup/reset page, redirecting
            // to `/` creates an infinite loop (the middleware bounces them
            // back to /setup, which remounts providers, which 401 again).
            if (response.status === 401 && typeof window !== 'undefined') {
                const isRefreshCall = endpoint === '/auth/refresh' || endpoint.startsWith('/auth/refresh');
                if (!_retry && !isRefreshCall) {
                    const refreshed = await refreshAccessToken();
                    if (refreshed) {
                        return apiRequest(endpoint, { ...options, _retry: true });
                    }
                }
                const path = window.location.pathname;
                const unauthRoutes = ['/', '/setup', '/register', '/reset-password', '/two-factor-setup'];
                const onUnauthRoute = unauthRoutes.includes(path) || path.startsWith('/setup/') || path.startsWith('/reset-password');
                if (!onUnauthRoute) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user');
                    document.cookie = 'cms_token=; path=/; max-age=0; SameSite=Lax';
                    window.location.href = '/';
                }
                throw new Error('Session expired. Please log in again.');
            }

            const errorMessage = data.message || 'An unexpected error occurred';

            // Check for revoked access and trigger immediate boot-out
            if (errorMessage === 'Your access has been revoked. Please contact an administrator.') {
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('session-revoked', {
                        detail: { message: errorMessage }
                    }));
                }
            }

            if (!skipNotification && typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('api-notification', {
                    detail: { message: errorMessage, type: 'error' }
                }));
            }
            throw new Error(errorMessage);
        }

        if (data.message && !skipNotification && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('api-notification', {
                detail: { message: data.message, type: 'success' }
            }));
        }

        return data;
    } catch (error: any) {
        // Check if it's a network error (backend not running)
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
            // Silently handle network errors in development
            console.debug('Backend API not available:', endpoint);
            throw new Error('Backend API is not available. Please ensure the server is running.');
        }

        // Log other errors normally only if notification is not skipped
        if (!skipNotification) {
            console.error('API Request Error:', error);
        }
        throw error;
    }
}
