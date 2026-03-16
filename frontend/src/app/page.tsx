'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { useNotification } from '@/context/NotificationContext';
import { setAuthToken } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function LoginPageInner() {
    const { showToast } = useNotification();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
        cms_subtitle: 'Elevate Your Horizontal Content Strategy',
        cms_login_avatar: '/assets/boy_idea_shock.png'
    });

    useEffect(() => {
        const alert = searchParams.get('alert');
        if (alert === 'setup-already-complete') {
            showToast('Setup is Already Completed. Please log in.', 'info');
        }
    }, [searchParams, showToast]);

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
        } catch (error) {
            showToast('Failed to send request', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${API_URL}/settings`);
                const data = await res.json();
                if (data.cms_title) setSettings(data);
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            }
        };
        fetchSettings();
    }, []);

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
        } catch (error) {
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
                showToast(data.message || 'Login failed: Invalid credentials', 'error');
            }
        } catch (error) {
            showToast('Login failed: Server unreachable', 'error');
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
        } catch (error) {
            showToast('Error changing password', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 font-sans selection:bg-blue-600 selection:text-white">

            {/* Cinematic Background Elements */}

            <div className="relative w-full max-w-md">
                {/* Avatar Section */}
                <div className="flex justify-center -mb-20 relative z-10">
                    <div className="relative p-1 rounded-full bg-white shadow-2xl border border-slate-100">
                        <div className="w-32 h-32 rounded-full overflow-hidden grayscale hover:grayscale-0 transition-all duration-1000 border-4 border-white">
                            <Image
                                src={settings.cms_login_avatar}
                                alt="CMS Avatar"
                                width={128}
                                height={128}
                                className="object-cover"
                                priority
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white rounded-[3rem] p-10 pt-28 space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>

                    <div className="text-center relative z-10">
                        <span className="section-label mb-4">Secure Access</span>
                        <h2 className="premium-heading text-4xl text-slate-900 leading-none mb-2">
                            {settings.cms_title.split(' ')[0]} <span className="low-opacity">{settings.cms_title.split(' ')[1] || 'CMS'}</span>
                        </h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{settings.cms_subtitle}</p>
                    </div>

                    {!showChangePassword && !showForgotPassword && !showTwoFactor ? (
                        <form className="mt-8 space-y-6 relative z-10" onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Identifier</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <EnvelopeIcon className="h-4 w-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-none text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-0 focus:border-blue-600 transition-all sm:text-xs font-bold"
                                            placeholder="ADMIN@CORE.SYSTEM"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Credential</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <LockClosedIcon className="h-4 w-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-none text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-0 focus:border-blue-600 transition-all sm:text-xs font-bold"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest px-2">
                                <label className="flex items-center text-slate-400 cursor-pointer hover:text-slate-900 transition-colors">
                                    <input
                                        type="checkbox"
                                        className="h-3 w-3 rounded-none border-slate-300 bg-white text-blue-600 focus:ring-0"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <span className="ml-2">Initialize Session</span>
                                </label>
                                <button type="button" onClick={() => setShowForgotPassword(true)} className="text-blue-600 hover:text-blue-700 underline underline-offset-4 decoration-blue-500/20">Recovery</button>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="relative flex w-full justify-center bg-slate-900 py-5 text-[11px] font-black uppercase tracking-[0.3em] text-white shadow-2xl transition-all hover:bg-blue-600 focus:outline-none active:scale-[0.98]"
                            >
                                {isLoading ? 'Processing...' : 'Authenticate Access'}
                            </button>
                        </form>
                    ) : showForgotPassword ? (
                        <form className="mt-8 space-y-6 relative z-10" onSubmit={handleForgotPassword}>
                            <div className="text-center mb-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Credential Recovery</h3>
                                <p className="text-[11px] text-slate-400 mt-2">Enter parameters for system override.</p>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <EnvelopeIcon className="h-4 w-4 text-slate-300" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-none text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-0 focus:border-blue-600 sm:text-xs font-bold uppercase"
                                    placeholder="Enter account identifier"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-3">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-blue-600 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-white hover:bg-blue-700 transition-all"
                                >
                                    {isLoading ? 'Requesting...' : 'Initiate Recovery'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(false)}
                                    className="w-full py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-all border border-slate-100"
                                >
                                    Cancel Request
                                </button>
                            </div>
                        </form>
                    ) : showTwoFactor ? (
                        <form className="mt-8 space-y-6 relative z-10" onSubmit={handleTwoFactorSubmit}>
                            <div className="text-center mb-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Second Layer Verification</h3>
                                <p className="text-[11px] text-slate-400 mt-2">Submit 6-digit syncronized token.</p>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <LockClosedIcon className="h-4 w-4 text-slate-300" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-none text-slate-900 text-center tracking-[1em] text-xl font-bold placeholder-slate-200 focus:outline-none focus:ring-0 focus:border-blue-600 sm:text-lg"
                                    placeholder="000000"
                                    value={twoFactorCode}
                                    onChange={(e) => setTwoFactorCode(e.target.value)}
                                    maxLength={6}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-slate-900 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-white hover:bg-blue-600 transition-all shadow-xl"
                            >
                                {isLoading ? 'Verifying...' : 'Finalize Auth'}
                            </button>
                        </form>
                    ) : (
                        <form className="mt-8 space-y-6 relative z-10" onSubmit={handleChangePassword}>
                            <div className="p-4 bg-blue-50/50 border border-blue-100/50 text-blue-800 text-[10px] font-bold uppercase tracking-widest leading-loose text-center">
                                Initial entry detected. <br /> Define primary administrative credential.
                            </div>
                            <div className="space-y-4">
                                <input
                                    type="password"
                                    required
                                    className="block w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-none text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-0 focus:border-blue-600 sm:text-xs font-bold"
                                    placeholder="NEW CIPHER"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <input
                                    type="password"
                                    required
                                    className="block w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-none text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-0 focus:border-blue-600 sm:text-xs font-bold"
                                    placeholder="CONFIRM CIPHER"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-white hover:bg-blue-700 transition-all shadow-xl"
                            >
                                {isLoading ? 'Encrypting...' : 'Secure Account & Initiate'}
                            </button>
                        </form>
                    )}

                    <div className="pt-8 border-t border-slate-50 relative z-10 flex flex-col items-center gap-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                            System Gateway v1.4.2
                        </p>
                        <div className="flex gap-6 opacity-30 hover:opacity-100 transition-opacity">
                            <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                            <div className="w-1 h-1 bg-slate-900 rounded-full"></div>
                            <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                        </div>
                    </div>
                </div>
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
