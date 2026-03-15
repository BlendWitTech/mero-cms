'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const FEATURES = [
    { icon: '📝', title: 'Blog & Content', desc: 'Posts, categories, tags, and comments with a rich editor.' },
    { icon: '🎨', title: 'Theme System', desc: 'Upload ZIP themes. Each theme seeds its own demo content automatically.' },
    { icon: '📂', title: 'Pages & Menus', desc: 'Static pages and dynamic nested navigation menus.' },
    { icon: '🏢', title: 'Services & Team', desc: 'Showcase your services, team members, and client testimonials.' },
    { icon: '📊', title: 'Analytics', desc: 'Google Analytics 4 dashboard embedded inside the admin UI.' },
    { icon: '🔍', title: 'SEO Toolkit', desc: 'Per-page meta tags, sitemap, robots.txt, and URL redirects.' },
    { icon: '👥', title: 'Roles & Permissions', desc: 'Fine-grained access control. Super Admin, Admin, and custom roles.' },
    { icon: '📸', title: 'Media Manager', desc: 'Upload and organise images and files used across all content.' },
];

function OAuthButton({
    provider,
    label,
    icon,
    loading,
    onClick,
}: {
    provider: string;
    label: string;
    icon: React.ReactNode;
    loading: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50"
        >
            {icon}
            {loading ? 'Signing in…' : label}
        </button>
    );
}

export default function LandingPage() {
    const { status } = useSession();
    const router = useRouter();
    const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'authenticated') router.replace('/dashboard');
    }, [status, router]);

    const handleSignIn = async (provider: string) => {
        setLoadingProvider(provider);
        await signIn(provider, { callbackUrl: '/dashboard' });
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Nav */}
            <nav className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-100 bg-white/90 px-6 py-4 backdrop-blur">
                <span className="text-lg font-bold text-brand-600">Mero CMS</span>
                <div className="flex items-center gap-4">
                    <Link href="/pricing" className="text-sm text-gray-600 hover:text-brand-600">
                        Pricing
                    </Link>
                    <a
                        href="https://blendwit.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-600 hover:text-brand-600"
                    >
                        Blendwit.com
                    </a>
                </div>
            </nav>

            {/* Hero */}
            <section className="flex flex-col items-center justify-center px-6 py-20 text-center bg-gradient-to-b from-brand-50 to-white">
                <span className="mb-4 inline-block rounded-full bg-brand-100 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Free Demo Access
                </span>
                <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl">
                    The CMS that does exactly{' '}
                    <span className="text-brand-600">what you need.</span>
                    <br />Nothing more.
                </h1>
                <p className="mt-5 max-w-xl text-lg text-gray-500">
                    Mero CMS is a modular, self-hosted content management system built with NestJS and Next.js.
                    Enable only the features your project needs — then deploy a theme and go live in minutes.
                </p>
                <p className="mt-2 text-sm font-medium text-brand-600">
                    Sign in below to explore the demo. No credit card required.
                </p>

                {/* Login box */}
                <div className="mt-10 w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
                    <h2 className="mb-1 text-lg font-bold text-gray-900">Try it for free</h2>
                    <p className="mb-6 text-sm text-gray-500">Sign in to access the demo playground</p>
                    <div className="flex flex-col gap-3">
                        <OAuthButton
                            provider="google"
                            label="Continue with Google"
                            loading={loadingProvider === 'google'}
                            onClick={() => handleSignIn('google')}
                            icon={
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            }
                        />
                        <OAuthButton
                            provider="github"
                            label="Continue with GitHub"
                            loading={loadingProvider === 'github'}
                            onClick={() => handleSignIn('github')}
                            icon={
                                <svg className="h-5 w-5 fill-gray-900" viewBox="0 0 24 24">
                                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                                </svg>
                            }
                        />
                        <OAuthButton
                            provider="linkedin"
                            label="Continue with LinkedIn"
                            loading={loadingProvider === 'linkedin'}
                            onClick={() => handleSignIn('linkedin')}
                            icon={
                                <svg className="h-5 w-5 fill-[#0A66C2]" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                            }
                        />
                    </div>
                    <p className="mt-5 text-xs text-gray-400">
                        By signing in you agree to our{' '}
                        <a href="https://blendwit.com/privacy" className="underline">
                            Privacy Policy
                        </a>
                        . We only store your name and email.
                    </p>
                </div>
            </section>

            {/* Features */}
            <section className="px-6 py-20 bg-white">
                <div className="mx-auto max-w-5xl">
                    <h2 className="mb-3 text-center text-3xl font-bold text-gray-900">
                        Everything you need to manage content
                    </h2>
                    <p className="mb-12 text-center text-gray-500">
                        Enable only the modules your project needs. Start small, expand later.
                    </p>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {FEATURES.map((f) => (
                            <div key={f.title} className="rounded-xl border border-gray-100 p-5 shadow-sm hover:border-brand-200 hover:shadow-md transition">
                                <div className="mb-3 text-3xl">{f.icon}</div>
                                <h3 className="mb-1 font-semibold text-gray-900">{f.title}</h3>
                                <p className="text-sm text-gray-500">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="px-6 py-20 bg-brand-50">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="mb-10 text-3xl font-bold text-gray-900">How Mero CMS works</h2>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        {[
                            { step: '1', title: 'Run the setup wizard', desc: 'Choose your modules, create your admin account, and push the database schema — all in one step.' },
                            { step: '2', title: 'Upload or pick a theme', desc: 'Activate a theme and the CMS seeds all demo content automatically. Your site is live instantly.' },
                            { step: '3', title: 'Manage content', desc: 'Write blogs, manage pages, upload media, track leads, and monitor analytics from a single dashboard.' },
                        ].map((s) => (
                            <div key={s.step} className="rounded-2xl bg-white p-6 shadow-sm">
                                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white mx-auto">
                                    {s.step}
                                </div>
                                <h3 className="mb-2 font-semibold text-gray-900">{s.title}</h3>
                                <p className="text-sm text-gray-500">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA banner */}
            <section className="px-6 py-16 bg-brand-600 text-white text-center">
                <h2 className="mb-3 text-3xl font-bold">Ready to own your CMS?</h2>
                <p className="mb-8 text-brand-100">
                    One-time license. Self-hosted. No monthly fees.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/pricing"
                        className="rounded-xl bg-white px-8 py-3 font-semibold text-brand-700 shadow hover:bg-brand-50 transition"
                    >
                        View Pricing
                    </Link>
                    <button
                        onClick={() => handleSignIn('google')}
                        className="rounded-xl border border-white/30 px-8 py-3 font-semibold text-white hover:bg-white/10 transition"
                    >
                        Try the Demo
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-100 px-6 py-8 text-center text-sm text-gray-400">
                © {new Date().getFullYear()} Blendwit Tech. All rights reserved.{' '}
                <a href="https://blendwit.com" className="hover:text-brand-600">blendwit.com</a>
            </footer>
        </div>
    );
}
