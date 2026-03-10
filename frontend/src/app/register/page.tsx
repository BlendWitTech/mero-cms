'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { LockClosedIcon, UserIcon, EnvelopeIcon, ArrowRightIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

const API_URL = 'http://localhost:3001';

function RegisterForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [invitation, setInvitation] = useState<any>(null);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [settings, setSettings] = useState({
        cms_title: 'Blendwit CMS',
        cms_subtitle: 'Elevate Your Horizontal Content Strategy',
        cms_login_avatar: '/assets/boy_idea_shock.png'
    });

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
            } catch (err) {
                setError('Connection error. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
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
            setError('Password must be at least 8 characters long.');
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
                setTimeout(() => {
                    window.location.href = '/';
                }, 3000);
            } else {
                const data = await res.json();
                setError(data.message || 'Registration failed.');
            }
        } catch (err) {
            setError('Server error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Verifying Invitation...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center space-y-6">
                <div className="flex justify-center">
                    <div className="p-4 bg-red-50 rounded-full">
                        <ExclamationCircleIcon className="h-12 w-12 text-red-500" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h3 className="premium-heading text-2xl text-slate-900">Access Denied</h3>
                    <p className="text-xs text-slate-400 font-medium px-4">{error}</p>
                </div>
                <button
                    onClick={() => window.location.href = '/'}
                    className="inline-flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:gap-4 transition-all"
                >
                    Back to Terminal <ArrowRightIcon className="h-3 w-3" />
                </button>
            </div>
        );
    }

    if (success) {
        return (
            <div className="text-center space-y-6">
                <div className="flex justify-center">
                    <div className="p-4 bg-emerald-50 rounded-full animate-bounce">
                        <CheckCircleIcon className="h-12 w-12 text-emerald-500" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h3 className="premium-heading text-2xl text-slate-900">Account Active</h3>
                    <p className="text-xs text-slate-400 font-medium">Your credentials have been established. Redirecting to gateway...</p>
                </div>
                <div className="pt-4">
                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-full origin-left animate-[loading_3s_linear]"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
            <div className="text-center mb-8">
                <span className="section-label mb-4">Onboarding</span>
                <h2 className="premium-heading text-3xl text-slate-900 leading-none mb-2">
                    Establish <span className="low-opacity">Access</span>
                </h2>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Invited: {invitation?.email}</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Identity</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <UserIcon className="h-4 w-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                        </div>
                        <input
                            type="text"
                            required
                            className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-none text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-0 focus:border-blue-600 transition-all sm:text-xs font-bold"
                            placeholder="YOUR FULL NAME"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Access Cipher</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <LockClosedIcon className="h-4 w-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                        </div>
                        <input
                            type="password"
                            required
                            className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-none text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-0 focus:border-blue-600 transition-all sm:text-xs font-bold"
                            placeholder="MlN. 8 CHARACTERS"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Confirm Cipher</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <LockClosedIcon className="h-4 w-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                        </div>
                        <input
                            type="password"
                            required
                            className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-none text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-0 focus:border-blue-600 transition-all sm:text-xs font-bold"
                            placeholder="REPEAT PASSWORD"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="relative flex w-full justify-center bg-slate-900 py-5 text-[11px] font-black uppercase tracking-[0.3em] text-white shadow-2xl transition-all hover:bg-blue-600 focus:outline-none active:scale-[0.98]"
            >
                {isSubmitting ? 'Registering...' : 'Complete Onboarding'}
            </button>
        </form>
    );
}

export default function RegisterPage() {
    const [settings, setSettings] = useState({
        cms_title: 'Blendwit CMS',
        cms_subtitle: 'Elevate Your Horizontal Content Strategy',
        cms_login_avatar: '/assets/boy_idea_shock.png'
    });

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

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 font-sans selection:bg-blue-600 selection:text-white">
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

                    <Suspense fallback={
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading Terminal...</p>
                        </div>
                    }>
                        <RegisterForm />
                    </Suspense>

                    <div className="pt-8 border-t border-slate-50 relative z-10 flex flex-col items-center gap-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                            System Gateway v1.4.2
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
