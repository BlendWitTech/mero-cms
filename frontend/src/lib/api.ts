export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';

interface RequestOptions {
    method?: HttpMethod;
    body?: any;
    headers?: Record<string, string>;
    skipNotification?: boolean;
}

export async function apiRequest(endpoint: string, options: RequestOptions = {}) {
    const { method = 'GET', body, headers = {}, skipNotification = false } = options;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method,
            headers: { ...defaultHeaders, ...headers },
            body: body ? JSON.stringify(body) : undefined,
        });

        const data = await response.json();

        if (!response.ok) {
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
