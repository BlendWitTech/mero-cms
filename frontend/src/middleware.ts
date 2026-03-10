import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Intercept root (login page) and all dashboard routes
    const isRoot = pathname === '/';
    const isDashboard = pathname.startsWith('/dashboard');
    if (!isRoot && !isDashboard) return NextResponse.next();

    try {
        const res = await fetch(`${API_URL}/setup/status`, {
            cache: 'no-store',
            signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
            const data = await res.json();
            if (!data.setupComplete) {
                return NextResponse.redirect(new URL('/setup', request.url));
            }
        }
    } catch {
        // Backend unreachable — don't block access, let the page handle it
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/', '/dashboard/:path*'],
};
