import { NextResponse, type NextRequest } from 'next/server';

/**
 * Edge middleware — checks the backend's /redirects/check/:path endpoint
 * for any active redirect rule and applies it before the page renders.
 *
 * Skips static assets and API/_next paths to keep latency low. Any
 * network error is silently treated as "no redirect" so the request
 * continues normally.
 *
 * Configure via NEXT_PUBLIC_API_URL — same env var the rest of the
 * theme uses.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const SKIP_PREFIXES = ['/_next', '/api', '/admin', '/uploads', '/favicon.ico'];

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;

    // Quick path filtering — skip anything that isn't a real route.
    if (SKIP_PREFIXES.some(p => path.startsWith(p))) return NextResponse.next();
    if (/\.[a-z0-9]+$/i.test(path)) return NextResponse.next(); // skip file extensions

    try {
        const res = await fetch(
            `${API_URL}/redirects/check/${encodeURIComponent(path.replace(/^\//, ''))}`,
            { signal: AbortSignal.timeout(800) },
        );
        if (!res.ok) return NextResponse.next();
        const rule = (await res.json()) as { fromPath: string; toPath: string; statusCode: number } | null;
        if (rule?.toPath) {
            const url = req.nextUrl.clone();
            url.pathname = rule.toPath.startsWith('/') ? rule.toPath : `/${rule.toPath}`;
            return NextResponse.redirect(url, rule.statusCode || 308);
        }
    } catch {
        // Backend unreachable / timeout — let the request through.
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // All routes except _next/static, _next/image, favicon.
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
