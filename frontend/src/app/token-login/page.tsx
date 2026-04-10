'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setAuthToken } from '@/lib/auth';

/**
 * Token-login page — handles two flows:
 *   ?token=<jwt>  — direct token injection (e.g. from email link)
 *   ?demo=1       — fetches a demo JWT from /auth/demo-login then redirects
 */
function TokenLoginInner() {
    const router = useRouter();
    const params = useSearchParams();

    useEffect(() => {
        const token = params.get('token');
        const isDemo = params.get('demo') === '1';

        if (token) {
            setAuthToken(token);
            router.replace('/dashboard');
            return;
        }

        if (isDemo) {
            fetch('/api/demo/login')
                .then(r => r.json())
                .then(data => {
                    if (data?.access_token) {
                        setAuthToken(data.access_token);
                        router.replace('/dashboard');
                    } else {
                        router.replace('/');
                    }
                })
                .catch(() => router.replace('/'));
            return;
        }

        // No recognised params — send to home
        router.replace('/');
    }, [params, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <p className="text-slate-500 text-sm">Signing you in…</p>
        </div>
    );
}

export default function TokenLoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <p className="text-slate-500 text-sm">Signing you in…</p>
            </div>
        }>
            <TokenLoginInner />
        </Suspense>
    );
}
