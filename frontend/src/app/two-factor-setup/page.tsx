'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useNotification } from '@/context/NotificationContext';
import { getApiBaseUrl } from '@/lib/api';
import { setAuthToken } from '@/lib/auth';

const API_URL = getApiBaseUrl();

/**
 * Forced 2FA enrolment page.
 *
 * Reached when an admin hits /auth/login and the backend returns
 * `requires2faSetup: true` because the `security_force_2fa_for_admins`
 * policy is on. The URL's `token` query param is the scope-limited temp
 * token; it's only accepted by the two setup endpoints below — every
 * other guarded route rejects it with 401.
 *
 * Flow:
 *   1. Mount   → POST /auth/2fa/setup-start   → { qrCode, secret }
 *   2. Submit  → POST /auth/2fa/setup-complete → { access_token, refresh_token }
 *   3. Persist tokens → redirect to /dashboard
 */
function TwoFactorSetupInner() {
    const { showToast } = useNotification();
    const params = useSearchParams();
    const router = useRouter();

    const [tempToken, setTempToken] = useState('');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [secret, setSecret] = useState('');
    const [code, setCode] = useState('');
    const [isLoadingQr, setIsLoadingQr] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [startError, setStartError] = useState<string | null>(null);

    // Step 1: exchange the temp token for a QR code on mount.
    useEffect(() => {
        const t = params.get('token') || '';
        if (!t) {
            setStartError('Missing enrolment token. Return to the login page and try again.');
            setIsLoadingQr(false);
            return;
        }
        setTempToken(t);

        (async () => {
            try {
                const res = await fetch(`${API_URL}/auth/2fa/setup-start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tempToken: t }),
                });
                const data = await res.json();
                if (!res.ok || !data?.qrCode) {
                    setStartError(data?.message || 'Enrolment token is invalid or expired. Log in again to get a fresh one.');
                    return;
                }
                setQrCode(data.qrCode);
                setSecret(data.secret || '');
            } catch {
                setStartError('Could not reach the server. Check your connection and retry.');
            } finally {
                setIsLoadingQr(false);
            }
        })();
    }, [params]);

    // Step 2 + 3: verify the TOTP, grab the session, and land in /dashboard.
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        if (code.trim().length < 6) {
            showToast('Enter the 6-digit code from your authenticator.', 'error');
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/auth/2fa/setup-complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tempToken, token: code.trim() }),
            });
            const data = await res.json();
            if (!res.ok || !data?.success || !data?.access_token) {
                showToast(data?.message || 'Code rejected — try again.', 'error');
                return;
            }
            setAuthToken(data.access_token, false, data.refresh_token);
            showToast('2FA enabled. Welcome!', 'success');
            router.replace('/dashboard');
        } catch {
            showToast('Verification failed. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-10">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-white/[0.07] p-8">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-500/5 mb-4">
                        <ShieldCheckIcon className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Set up two-factor auth</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs">
                        Your administrator requires every admin account to use 2FA. Scan the QR code with Google Authenticator, 1Password, or Authy, then enter the 6-digit code below.
                    </p>
                </div>

                {startError ? (
                    <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50/70 dark:bg-red-500/[0.06] p-4 flex items-start gap-3">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-red-700 dark:text-red-300">Enrolment unavailable</p>
                            <p className="text-xs text-red-600/80 dark:text-red-300/80 mt-1">{startError}</p>
                            <button
                                onClick={() => router.replace('/')}
                                className="mt-3 text-xs font-bold text-red-700 dark:text-red-300 hover:underline"
                            >
                                Return to login →
                            </button>
                        </div>
                    </div>
                ) : isLoadingQr ? (
                    <div className="h-64 flex items-center justify-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Preparing QR code…</p>
                    </div>
                ) : (
                    <>
                        {qrCode && (
                            <div className="flex flex-col items-center gap-3 mb-6">
                                <div className="rounded-xl bg-white p-3 border border-slate-200 dark:border-white/10">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={qrCode} alt="2FA QR code" className="h-48 w-48" />
                                </div>
                                {secret && (
                                    <details className="text-xs text-slate-500 dark:text-slate-400">
                                        <summary className="cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-300">
                                            Can't scan? Enter the key manually
                                        </summary>
                                        <code className="block mt-2 font-mono text-[11px] break-all bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-white/10">
                                            {secret}
                                        </code>
                                    </details>
                                )}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                                    Authenticator code
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    pattern="[0-9]{6}"
                                    maxLength={6}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                    className="w-full text-center text-2xl font-mono tracking-[0.3em] py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                                    placeholder="000000"
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting || code.length < 6}
                                className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold py-3 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Verifying…' : 'Enable 2FA and sign in'}
                            </button>
                        </form>

                        <button
                            onClick={() => router.replace('/')}
                            className="w-full mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                            Cancel and return to login
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function TwoFactorSetupPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-slate-500 text-sm">Loading…</p></div>}>
            <TwoFactorSetupInner />
        </Suspense>
    );
}
