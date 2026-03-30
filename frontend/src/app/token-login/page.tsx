'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setAuthToken } from '@/lib/auth';

/**
 * Demo auto-login landing page.
 * Usage: /token-login?token=<jwt>
 * Stores the token and redirects to the dashboard.
 * Also handles the demo "Try Now" flow via /token-login?demo=1
 * which first calls /api/auth/demo-login to get a token.
 */
export default function TokenLoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const run = async () => {
            try {
                let token = searchParams.get('token');

                // Demo mode: fetch a token automatically
                if (!token && searchParams.get('demo') === '1') {
                    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                    const res = await fetch(`${apiBase}/auth/demo-login`);
                    if (!res.ok) throw new Error('Demo login failed — server returned ' + res.status);
                    const data = await res.json();
                    token = data.access_token;
                }

                if (!token) throw new Error('No token provided');

                setAuthToken(token);
                router.replace('/dashboard');
            } catch (err: any) {
                setErrorMsg(err.message || 'Login failed');
                setStatus('error');
            }
        };
        run();
    }, [router, searchParams]);

    if (status === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center max-w-sm">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-lg font-bold text-slate-900 mb-2">Login Failed</h1>
                    <p className="text-sm text-slate-500 mb-4">{errorMsg}</p>
                    <a href="/" className="text-sm font-semibold text-blue-600 hover:underline">
                        Back to login
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-semibold text-slate-600">Signing you in…</p>
            </div>
        </div>
    );
}
