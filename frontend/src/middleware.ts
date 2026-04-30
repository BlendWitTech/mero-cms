import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/** Routes that require an authenticated session. */
const PROTECTED_PATHS = ['/dashboard', '/settings'];

/** Routes accessible only when setup is NOT complete. */
const SETUP_ONLY_PATH = '/setup';


export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ── 1. Check setup status ────────────────────────────────────────────────
    let setupComplete = true; // fail-open: if backend is down, don't hard-block
    try {
        const res = await fetch(`${API_URL}/setup/status`, {
            cache: 'no-store',
            signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
            const data = await res.json();
            setupComplete = Boolean(data.setupComplete);
        }
    } catch {
        // Backend unreachable — keep fail-open so the login page still loads
    }

    // ── 2. Setup not complete: only /setup is accessible ────────────────────
    if (!setupComplete) {
        if (pathname === SETUP_ONLY_PATH) return NextResponse.next();
        return NextResponse.redirect(new URL(SETUP_ONLY_PATH, request.url));
    }

    // ── 3. Setup IS complete ─────────────────────────────────────────────────

    // Block /setup — redirect to login with an alert
    if (pathname === SETUP_ONLY_PATH) {
        return NextResponse.redirect(new URL('/?alert=setup-already-complete', request.url));
    }

    // Auth cookie set by setAuthToken() in @/lib/auth
    const isDemoRequest = request.nextUrl.searchParams.get('demo') === '1';
    const cookieName = isDemoRequest ? 'cms_demo_token' : 'cms_token';
    const token = request.cookies.get(cookieName)?.value;

    const isProtected = PROTECTED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));

    if (isProtected) {
        // No token at all → login
        if (!token) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        // Validate token with the backend.
        // Fail-open on 5xx, 429, or network errors — those are backend
        // conditions, not auth problems, and clearing the user's session
        // because the rate-limiter briefly fired would be hostile.
        // Only 401/403 count as "this token is actually invalid".
        let tokenValid = true;
        try {
            const authRes = await fetch(`${API_URL}/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
                signal: AbortSignal.timeout(3000),
            });
            if (authRes.status === 401 || authRes.status === 403) {
                tokenValid = false;
            }
            // everything else (200, 429, 500, timeout) → keep session
        } catch {
            // Backend unreachable — fail-open so dashboard still loads when backend restarts
            tokenValid = true;
        }

        if (!tokenValid) {
            // Expired / invalid token — clear cookie and send to login
            const res = NextResponse.redirect(new URL('/', request.url));
            res.cookies.set('cms_token', '', { path: '/', maxAge: 0 });
            return res;
        }
    }

    // Login page: redirect already-authenticated users to dashboard
    if (pathname === '/' && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    // Run on all paths except Next.js internals, API routes, and any
    // static asset (paths ending in a known file extension). Without
    // the extension exclusion, files in `public/` like /emblem.svg,
    // /logo.svg, /robots.txt etc. get a 307 redirect to /login because
    // unauthenticated users would be treated like they were trying to
    // hit a protected page. The extension list covers SVG, raster
    // images, web fonts, plain CSS/JS, and the small set of metadata
    // files Next.js produces (sitemap, robots, manifest).
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|assets|uploads|api/|.+\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|css|js|map|txt|xml|json|webmanifest)$).*)',
    ],
};
