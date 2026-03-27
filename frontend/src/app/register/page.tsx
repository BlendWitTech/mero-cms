'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
    LockClosedIcon,
    UserIcon,
    EyeIcon,
    EyeSlashIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function RegisterForm({ settings }: { settings: any }) {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [invitation, setInvitation] = useState<any>(null);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setError('No invitation token provided.');
                setIsLoading(false);
                return;
            }
            try {
                const res = await fetch(`${API_URL}/invitations/verify/${token}`);
                if (!res.ok) {
                    const data = await res.json();
                    setError(data.message || 'Invalid or expired invitation.');
                } else {
                    const data = await res.json();
                    setInvitation(data);
                }
            } catch {
                setError('Connection error. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        verifyToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/auth/register-invited`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, name, password }),
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => { window.location.href = '/'; }, 3000);
            } else {
                const data = await res.json();
                setError(data.message || 'Registration failed.');
            }
        } catch {
            setError('Server error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium";

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="w-10 h-10 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-xs font-semibold text-slate-400">Verifying invitation…</p>
            </div>
        );
    }

    if (error && !invitation) {
        return (
            <div className="flex flex-col items-center text-center py-8 space-y-6">
                <div className="p-4 bg-red-50 rounded-2xl">
                    <ExclamationCircleIcon className="h-10 w-10 text-red-500" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-900 mb-1">Access Denied</h3>
                    <p className="text-sm text-slate-500 font-medium">{error}</p>
                </div>
                <button
                    onClick={() => window.location.href = '/'}
                    className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                    ← Back to sign in
                </button>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex flex-col items-center text-center py-8 space-y-6">
                <div className="p-4 bg-emerald-50 rounded-2xl animate-bounce">
                    <CheckCircleIcon className="h-10 w-10 text-emerald-500" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-900 mb-1">Account Created!</h3>
                    <p className="text-sm text-slate-500 font-medium">Redirecting you to the sign in page…</p>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full animate-[loading_3s_linear_forwards] w-full origin-left" />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="mb-8">
                <h2 className="text-2xl font-black text-slate-900 mb-1">Complete your account</h2>
                <p className="text-sm text-slate-500 font-medium">
                    You&apos;ve been invited as <span className="font-bold text-slate-700">{invitation?.email}</span>
                </p>
            </div>

            {error && (
                <div className="mb-4 p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-red-600">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                    <div className="relative group">
                        <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            required
                            autoComplete="name"
                            className={inputClass}
                            placeholder="Your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
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
                            autoComplete="new-password"
                            className={`${inputClass} pr-11`}
                            placeholder="Min. 8 characters"
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

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm Password</label>
                    <div className="relative group">
                        <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            autoComplete="new-password"
                            className={`${inputClass} pr-11`}
                            placeholder="Repeat your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            {showConfirmPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-slate-900/20 hover:bg-blue-600 hover:shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Creating account…
                        </span>
                    ) : 'Create Account'}
                </button>
            </form>
        </>
    );
}

export default function RegisterPage() {
    const [settings, setSettings] = useState({
        cms_title: 'Blendwit CMS',
        cms_subtitle: 'Elevate Your Content Strategy',
        cms_login_avatar: '/assets/boy_idea_shock.png',
    });

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

                    <div className="space-y-3 w-full text-left">
                        {[
                            { icon: '✉️', text: 'You received a personal invitation' },
                            { icon: '🔒', text: 'Your account is pre-authorized' },
                            { icon: '⚡', text: 'Get started in seconds' },
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
                    <Suspense fallback={
                        <div className="flex flex-col items-center justify-center py-16 space-y-4">
                            <div className="w-10 h-10 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                            <p className="text-xs font-semibold text-slate-400">Loading…</p>
                        </div>
                    }>
                        <RegisterForm settings={settings} />
                    </Suspense>
                </div>

                <p className="mt-12 text-[10px] font-semibold text-slate-300 tracking-widest uppercase">
                    {settings.cms_title} · Admin Portal
                </p>
            </div>
        </div>
    );
}
