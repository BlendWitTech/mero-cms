'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { LockClosedIcon, EnvelopeIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useNotification } from '@/context/NotificationContext';
import { setAuthToken } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function LoginPageInner() {
    const { showToast } = useNotification();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [showTwoFactor, setShowTwoFactor] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [tempToken, setTempToken] = useState('');
    const [token, setToken] = useState('');
    const [settings, setSettings] = useState({
        cms_title: 'Blendwit CMS',
        cms_subtitle: 'Elevate Your Content Strategy',
        cms_login_avatar: '/assets/boy_idea_shock.png'
    });

    useEffect(() => {
        const alert = searchParams.get('alert');
        if (alert === 'setup-already-complete') {
            showToast('Setup is Already Completed. Please log in.', 'info');
        }
    }, [searchParams, showToast]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${API_URL}/settings`);
                const data = await res.json();
                if (data.cms_title) setSettings(data);
            } catch { }
        };
        fetchSettings();
    }, []);

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            showToast(data.message || 'If an account exists, an email has been sent.', 'success');
            setShowForgotPassword(false);
        } catch {
            showToast('Failed to send request', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTwoFactorSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/2fa/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: twoFactorCode, tempToken }),
            });
            const data = await res.json();
            if (data.success && data.access_token) {
                setAuthToken(data.access_token);
                window.location.href = '/dashboard';
            } else {
                showToast(data.message || 'Invalid 2FA code', 'error');
            }
        } catch {
            showToast('Verification failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, rememberMe }),
            });
            const data = await res.json();

            if (data.requires2fa) {
                setTempToken(data.temp_token);
                setShowTwoFactor(true);
                return;
            }

            if (data.access_token) {
                if (data.forcePasswordChange) {
                    setToken(data.access_token);
                    setShowChangePassword(true);
                } else {
                    setAuthToken(data.access_token);
                    window.location.href = '/dashboard';
                }
            } else {
                showToast(data.message || 'Invalid credentials. Please try again.', 'error');
            }
        } catch {
            showToast('Unable to connect. Please check your connection.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ newPassword }),
            });
            if (res.ok) {
                setAuthToken(token);
                window.location.href = '/dashboard';
            } else {
                const err = await res.json();
                showToast(err.message || 'Failed to change password', 'error');
            }
        } catch {
            showToast('Error changing password', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = "block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium";

    return (
        <div className="min-h-screen flex font-sans">
            {/* ── Left brand panel ──────────────────────────────── */}
            <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] flex-col items-center justify-center relative overflow-hidden bg-slate-900 text-white p-12">
                {/* Decorative grid */}
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                {/* Gradient orbs */}
                <div className="absolute top-[-80px] left-[-80px] w-[360px] h-[360px] rounded-full bg-blue-600/20 blur-[80px] pointer-events-none" />
                <div className="absolute bottom-[-60px] right-[-60px] w-[280px] h-[280px] rounded-full bg-indigo-600/15 blur-[60px] pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
                    {/* Avatar */}
                    <div className="w-28 h-28 rounded-2xl overflow-hidden mb-8 ring-4 ring-white/10 shadow-2xl">
                        <Image
                            src={settings.cms_login_avatar}
                            alt="CMS"
                            width={112}
                            height={112}
                            className="object-cover w-full h-full"
                            priority
                        />
                    </div>

                    <h1 className="text-3xl font-black tracking-tight mb-3 leading-tight">
                        {settings.cms_title}
                    </h1>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed mb-12">
                        {settings.cms_subtitle}
                    </p>

                    {/* Feature bullets */}
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
                    {!showChangePassword && !showForgotPassword && !showTwoFactor ? (
                        <>
                            <div className="mb-8">
                                <h2 className="text-2xl font-black text-slate-900 mb-1">Welcome back</h2>
                                <p className="text-sm text-slate-500 font-medium">Sign in to your admin account</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
                                    <div className="relative group">
                                        <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="email"
                                            required
                                            autoComplete="email"
                                            className={inputClass}
                                            placeholder="admin@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                                    <div className="relative group">
                                        <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            autoComplete="current-password"
                                            className={`${inputClass} pr-11`}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 cursor-pointer hover:text-slate-700 transition-colors">
                                        <input
                                            type="checkbox"
                                            className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                        />
                                        Remember me
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(true)}
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                    >
                                        Forgot password?
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full mt-2 bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-slate-900/20 hover:bg-blue-600 hover:shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Signing in…
                                        </span>
                                    ) : 'Sign In'}
                                </button>
                            </form>
                        </>
                    ) : showForgotPassword ? (
                        <>
                            <div className="mb-8">
                                <h2 className="text-2xl font-black text-slate-900 mb-1">Reset Password</h2>
                                <p className="text-sm text-slate-500 font-medium">Enter your email and we&apos;ll send a reset link</p>
                            </div>
                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                <div className="relative group">
                                    <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        className={inputClass}
                                        placeholder="Your email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <button type="submit" disabled={isLoading}
                                    className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-60">
                                    {isLoading ? 'Sending…' : 'Send Reset Link'}
                                </button>
                                <button type="button" onClick={() => setShowForgotPassword(false)}
                                    className="w-full py-3 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                                    ← Back to sign in
                                </button>
                            </form>
                        </>
                    ) : showTwoFactor ? (
                        <>
                            <div className="mb-8">
                                <h2 className="text-2xl font-black text-slate-900 mb-1">Two-Factor Auth</h2>
                                <p className="text-sm text-slate-500 font-medium">Enter the 6-digit code from your authenticator app</p>
                            </div>
                            <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
                                <input
                                    type="text"
                                    required
                                    className="block w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-center tracking-[0.5em] text-2xl font-black placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="000000"
                                    value={twoFactorCode}
                                    onChange={(e) => setTwoFactorCode(e.target.value)}
                                    maxLength={6}
                                />
                                <button type="submit" disabled={isLoading}
                                    className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-blue-600 transition-all active:scale-[0.98] disabled:opacity-60">
                                    {isLoading ? 'Verifying…' : 'Verify Code'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className="mb-8">
                                <h2 className="text-2xl font-black text-slate-900 mb-1">Set New Password</h2>
                                <p className="text-sm text-slate-500 font-medium">Please choose a secure password to continue</p>
                            </div>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs font-semibold text-blue-700">
                                    This is your first sign-in. Please set a new password to secure your account.
                                </div>
                                <input type="password" required placeholder="New password" value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className={inputClass.replace('pl-11', 'px-4')} />
                                <input type="password" required placeholder="Confirm new password" value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={inputClass.replace('pl-11', 'px-4')} />
                                <button type="submit" disabled={isLoading}
                                    className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-60">
                                    {isLoading ? 'Saving…' : 'Save Password & Continue'}
                                </button>
                            </form>
                        </>
                    )}
                </div>

                <p className="mt-12 text-[10px] font-semibold text-slate-300 tracking-widest uppercase">
                    {settings.cms_title} · Admin Portal
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginPageInner />
        </Suspense>
    );
}
