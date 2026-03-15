'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const DEMO_CMS_URL = process.env.NEXT_PUBLIC_DEMO_CMS_URL || '';
const BUY_URL = process.env.NEXT_PUBLIC_BUY_URL || 'https://blendwit.com/mero-cms/pricing';
const CONTACT_URL = process.env.NEXT_PUBLIC_CONTACT_URL || 'https://blendwit.com/contact';

const MODULES = [
    { icon: '📝', name: 'Blogs', desc: 'Write, schedule, and organise posts with categories and tags.' },
    { icon: '📄', name: 'Pages', desc: 'Manage static pages like About, Contact, and Privacy.' },
    { icon: '🧭', name: 'Menus', desc: 'Build dynamic nested navigation menus.' },
    { icon: '💼', name: 'Services', desc: 'Showcase your service or product offerings.' },
    { icon: '👥', name: 'Team', desc: 'Team member profiles with bio, photo, and role.' },
    { icon: '⭐', name: 'Testimonials', desc: 'Client reviews and social proof.' },
    { icon: '📥', name: 'Leads', desc: 'Contact form submissions with status tracking.' },
    { icon: '📸', name: 'Media', desc: 'Centralised image and file management.' },
    { icon: '📊', name: 'Analytics', desc: 'GA4 dashboard embedded inside the admin.' },
    { icon: '🔍', name: 'SEO', desc: 'Per-page meta, sitemap, robots.txt, and redirects.' },
    { icon: '🎨', name: 'Themes', desc: 'Upload ZIP themes; each theme seeds its own content.' },
    { icon: '🔐', name: 'Roles & Permissions', desc: 'Granular RBAC with Super Admin and custom roles.' },
];

const STEPS = [
    { num: '1', title: 'Setup wizard', desc: 'On first run, select your modules, create your admin account, and the database schema is built automatically.' },
    { num: '2', title: 'Activate a theme', desc: 'Click Setup on any theme — the CMS seeds all demo content (menus, posts, testimonials) from theme.json.' },
    { num: '3', title: 'Manage everything', desc: 'Write posts, upload media, reply to leads, check analytics — all from one clean dashboard.' },
];

function ProviderBadge({ provider }: { provider?: string }) {
    const map: Record<string, { label: string; bg: string }> = {
        google: { label: 'Google', bg: 'bg-red-100 text-red-700' },
        github: { label: 'GitHub', bg: 'bg-gray-100 text-gray-700' },
        linkedin: { label: 'LinkedIn', bg: 'bg-blue-100 text-blue-700' },
    };
    const entry = map[provider ?? ''] ?? { label: provider ?? '', bg: 'bg-gray-100 text-gray-600' };
    return (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${entry.bg}`}>
            via {entry.label}
        </span>
    );
}

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') router.replace('/');
    }, [status, router]);

    if (status === 'loading' || !session) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
            </div>
        );
    }

    const { user } = session;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top bar */}
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
                <span className="text-lg font-bold text-brand-600">Mero CMS Demo</span>
                <div className="flex items-center gap-4">
                    <Link href="/pricing" className="hidden sm:block text-sm text-gray-600 hover:text-brand-600">
                        Pricing
                    </Link>
                    <div className="flex items-center gap-2">
                        {user.image && (
                            <Image
                                src={user.image}
                                alt={user.name ?? ''}
                                width={32}
                                height={32}
                                className="rounded-full"
                            />
                        )}
                        <span className="hidden sm:block text-sm font-medium text-gray-800">{user.name}</span>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="text-sm text-gray-500 hover:text-gray-800"
                    >
                        Sign out
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-6 py-12">
                {/* Welcome */}
                <div className="mb-10 rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 p-8 text-white">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div>
                            <p className="text-brand-100 text-sm mb-1">Welcome to the demo</p>
                            <h1 className="text-2xl font-bold">
                                Hey{user.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋
                            </h1>
                            <p className="mt-2 text-brand-100 text-sm">
                                You&apos;re exploring Mero CMS. <ProviderBadge provider={user.provider} />
                            </p>
                            <p className="mt-1 text-brand-200 text-xs">
                                We&apos;ve noted your interest — a Blendwit team member may follow up at{' '}
                                <span className="font-medium text-white">{user.email}</span>.
                            </p>
                        </div>
                        {DEMO_CMS_URL && (
                            <a
                                href={DEMO_CMS_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 rounded-xl bg-white px-6 py-3 font-semibold text-brand-700 shadow hover:bg-brand-50 transition text-sm"
                            >
                                Launch Demo CMS →
                            </a>
                        )}
                    </div>
                </div>

                {/* How it works */}
                <h2 className="mb-5 text-xl font-bold text-gray-900">How Mero CMS works</h2>
                <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {STEPS.map((s) => (
                        <div key={s.num} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                                {s.num}
                            </div>
                            <h3 className="mb-1 font-semibold text-gray-900">{s.title}</h3>
                            <p className="text-sm text-gray-500">{s.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Modules grid */}
                <h2 className="mb-5 text-xl font-bold text-gray-900">Available modules</h2>
                <div className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {MODULES.map((m) => (
                        <div key={m.name} className="group rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:border-brand-300 transition">
                            <div className="mb-2 text-2xl">{m.icon}</div>
                            <p className="font-semibold text-sm text-gray-900">{m.name}</p>
                            <p className="mt-1 text-xs text-gray-500 leading-relaxed">{m.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Pricing CTA */}
                <div className="rounded-2xl border border-brand-100 bg-brand-50 p-8 text-center">
                    <h2 className="mb-2 text-2xl font-bold text-gray-900">Like what you see?</h2>
                    <p className="mb-6 text-gray-500 max-w-lg mx-auto">
                        Purchase the CMS backend to self-host, or let us build the whole thing — backend and custom theme — for you.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/pricing"
                            className="rounded-xl bg-brand-600 px-8 py-3 font-semibold text-white shadow hover:bg-brand-700 transition"
                        >
                            View Pricing
                        </Link>
                        <a
                            href={CONTACT_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl border border-brand-300 bg-white px-8 py-3 font-semibold text-brand-700 hover:bg-brand-100 transition"
                        >
                            Talk to Us
                        </a>
                    </div>
                </div>
            </main>

            <footer className="border-t border-gray-100 px-6 py-6 text-center text-sm text-gray-400">
                © {new Date().getFullYear()} Blendwit Tech.{' '}
                <a href={BUY_URL} className="hover:text-brand-600">Purchase a License</a>{' '}·{' '}
                <a href="https://blendwit.com" className="hover:text-brand-600">blendwit.com</a>
            </footer>
        </div>
    );
}
