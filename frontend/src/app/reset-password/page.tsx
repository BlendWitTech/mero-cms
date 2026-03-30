'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { LockClosedIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useNotification } from '@/context/NotificationContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function ResetPasswordInner() {
    const { showToast } = useNotification();
    const router = useRouter();
    const searchParams = useSearchParams();

    const token = searchParams.get('token') || '';
    const email = searchParams.get('email') || '';

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const [isInvalid, setIsInvalid] = useState(false);
    const [settings, setSettings] = useState({
        cms_title: 'Blendwit CMS',
        cms_subtitle: 'Elevate Your Content Strategy',
        cms_login_avatar: '/assets/boy_idea_shock.png',
    });

    useEffect(() => {
        if (!token || !email) {
            setIsInvalid(true);
            return;
        }
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${API_URL}/settings`);
                const data = await res.json();
                if (data.cms_title) setSettings(data);
            } catch { }
        };
        fetchSettings();
    }, [token, email]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 8) {
            showToast('Password must be at least 8 characters', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token, newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                setIsDone(true);
            } else {
                showToast(data.message || 'Reset failed. The link may have expired.', 'error');
                if (res.status === 401) setIsInvalid(true);
            }
        } catch {
            showToast('Unable to connect. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = "block w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium";

    return (
        <div className="min-h-screen flex font-sans">
            {/* ── Left brand panel ──────────────────────────────── */}
            <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] flex-col items-center justify-center relative overflow-hidden bg-slate-900 text-white p-12">
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <div className="absolute top-[-80px] left-[-80px] w-[360px] h-[360px] rounded-full bg-blue-600/20 blur-[80px] pointer-events-none" />
                <div className="absolute bottom-[-60px] right-[-60px] w-[280px] h-[280px] rounded-full bg-indigo-600/15 blur-[60px] pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
                    <div className="w-28 h-28 rounded-2xl overflow-hidden mb-8 ring-4 ring-white/10 shadow-2xl">
                        <Image src={settings.cms_login_avatar} alt="CMS" width={112} height={112} className="object-cover w-full h-full" priority />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight mb-3 leading-tight">{settings.cms_title}</h1>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed mb-12">{settings.cms_subtitle}</p>
                    <div className="space-y-3 w-full text-left">
                        {[
                            { icon: '🔒', text: 'Role-based access control' },
                            { icon: '⚡', text: 'Real-time content management' },
                            { icon: '🎨', text: 'Multi-theme support' },
                        ].map((f) => (
                            <div key={f.text} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                                <span className="text-lg">{f.icon}</span>
                                <span className="text-xs font-semibold text-slate-300">{f.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right form panel ───────────────────────────────── */}
            <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12">
                {/* Mobile logo */}
                <div className="flex lg:hidden items-center gap-3 mb-10">
                    <div className="w-10 h-10 rounded-xl overflow-hidden">
                        <Image src={settings.cms_login_avatar} alt="CMS" width={40} height={40} className="object-cover w-full h-full" />
                    </div>
                    <span className="text-lg font-black text-slate-900">{settings.cms_title}</span>
                </div>

                <div className="w-full max-w-sm">
                    {/* Invalid / expired link */}
                    {isInvalid && (
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
                                <XCircleIcon className="h-8 w-8 text-red-500" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2">Invalid link</h2>
                            <p className="text-sm text-slate-500 mb-8">
                                This password reset link is invalid or has expired. Links are valid for 1 hour.
                            </p>
                            <button
                                onClick={() => router.push('/')}
                                className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                            >
                                Back to login
                            </button>
                        </div>
                    )}

                    {/* Success state */}
                    {isDone && !isInvalid && (
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-5">
                                <CheckCircleIcon className="h-8 w-8 text-green-500" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2">Password reset</h2>
                            <p className="text-sm text-slate-500 mb-8">
                                Your password has been reset successfully. You can now sign in with your new password.
                            </p>
                            <button
                                onClick={() => router.push('/')}
                                className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                            >
                                Sign in
                            </button>
                        </div>
                    )}

                    {/* Reset form */}
                    {!isDone && !isInvalid && (
                        <>
                            <div className="mb-8">
                                <h2 className="text-2xl font-black text-slate-900 mb-1.5">Set new password</h2>
                                <p className="text-sm text-slate-500">
                                    Resetting password for <span className="font-semibold text-slate-700">{email}</span>
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* New password */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">New password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <LockClosedIcon className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            placeholder="Min. 8 characters"
                                            required
                                            className={inputClass}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(p => !p)}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm password */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Confirm password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <LockClosedIcon className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            placeholder="Repeat your password"
                                            required
                                            className={inputClass}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(p => !p)}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                                        >
                                            {showConfirm ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {confirmPassword && newPassword !== confirmPassword && (
                                        <p className="mt-1.5 text-xs text-red-500 font-medium">Passwords do not match</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || !newPassword || !confirmPassword}
                                    className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                            </svg>
                                            Resetting...
                                        </span>
                                    ) : 'Reset password'}
                                </button>

                                <div className="text-center pt-1">
                                    <button
                                        type="button"
                                        onClick={() => router.push('/')}
                                        className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors"
                                    >
                                        Back to login
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense>
            <ResetPasswordInner />
        </Suspense>
    );
}
