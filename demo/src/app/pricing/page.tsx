import Link from 'next/link';

const CONTACT_URL = process.env.NEXT_PUBLIC_CONTACT_URL || 'https://blendwit.com/contact';
const BUY_CMS_URL = process.env.NEXT_PUBLIC_BUY_URL || 'https://blendwit.com/mero-cms/pricing';

const CMS_FEATURES = [
    'NestJS backend + PostgreSQL',
    'Next.js admin dashboard',
    'All content modules (blogs, pages, menus, team, services, testimonials, leads, media, SEO, analytics)',
    'Theme upload system (ZIP upload)',
    'Role-based access control',
    'Setup wizard',
    '1 year of updates',
    'Deployment guide (Railway + Vercel)',
    'Community support via email',
];

const CUSTOM_FEATURES = [
    'Everything in CMS License',
    'Custom theme designed for your brand',
    'Theme built with Next.js + Tailwind CSS',
    'Theme seeded with your real content',
    'Deployed to Railway (backend) + Vercel (frontend)',
    'Theme ZIP packaged for upload / reuse',
    'Up to 2 revision rounds',
    'Priority email support for 90 days',
    'Onboarding call (30 min)',
];

const FAQ = [
    {
        q: 'What do I need to run the CMS?',
        a: 'Node.js 20+, a PostgreSQL database, and a server or hosting platform. We recommend Railway for the backend and Vercel for the admin frontend — both have free tiers.',
    },
    {
        q: 'Can I use the CMS for client projects?',
        a: 'The CMS License covers one deployment (one production site). Additional deployments require additional licenses. Contact us for team/agency pricing.',
    },
    {
        q: 'What is a "custom theme"?',
        a: 'A custom theme is a standalone Next.js website that reads content from your CMS via the public API. We design and build it to match your brand, seed it with your content, and package it as a reusable ZIP.',
    },
    {
        q: 'Do I own the code?',
        a: 'Yes. After purchase you receive the CMS source code with a single-deployment license. The custom theme (if purchased) is also yours.',
    },
    {
        q: 'What happens after 1 year?',
        a: 'You keep the version you purchased forever. The 1-year updates window means you can pull the latest releases for free during that period. After that, a renewal is available at a reduced rate.',
    },
    {
        q: 'Can I request a feature?',
        a: 'Yes. Feature requests from license holders are prioritised. Approved contributors can also submit pull requests.',
    },
];

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Nav */}
            <nav className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-100 bg-white/90 px-6 py-4 backdrop-blur">
                <Link href="/" className="text-lg font-bold text-brand-600">Mero CMS</Link>
                <Link href="/" className="text-sm text-gray-600 hover:text-brand-600">
                    ← Back to Demo
                </Link>
            </nav>

            {/* Header */}
            <section className="px-6 py-16 text-center bg-gradient-to-b from-brand-50 to-white">
                <span className="mb-3 inline-block rounded-full bg-brand-100 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Simple Pricing
                </span>
                <h1 className="text-4xl font-extrabold text-gray-900">Two ways to get Mero CMS</h1>
                <p className="mt-4 text-gray-500 max-w-xl mx-auto">
                    Buy the CMS backend and manage your own theme, or let us handle the entire setup — CMS plus a custom-designed theme built for your brand.
                </p>
            </section>

            {/* Pricing cards */}
            <section className="px-6 pb-20">
                <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-2">
                    {/* Tier 1 — CMS Only */}
                    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                        <div className="mb-6">
                            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">CMS License</p>
                            <p className="mt-2 text-4xl font-extrabold text-gray-900">
                                Contact Us
                            </p>
                            <p className="mt-1 text-sm text-gray-500">One-time · single deployment · 1 year updates</p>
                        </div>
                        <p className="mb-6 text-sm text-gray-600">
                            The full Mero CMS codebase — backend and admin dashboard. Deploy it yourself, attach your own theme, and manage all your content.
                        </p>
                        <ul className="mb-8 space-y-3 flex-1">
                            {CMS_FEATURES.map((f) => (
                                <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                                    <span className="mt-0.5 text-brand-600">✓</span>
                                    {f}
                                </li>
                            ))}
                        </ul>
                        <a
                            href={BUY_CMS_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full rounded-xl border border-brand-600 px-6 py-3 text-center font-semibold text-brand-700 hover:bg-brand-50 transition"
                        >
                            Get CMS License
                        </a>
                    </div>

                    {/* Tier 2 — CMS + Custom Theme */}
                    <div className="relative flex flex-col rounded-2xl border-2 border-brand-600 bg-white p-8 shadow-xl">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="rounded-full bg-brand-600 px-4 py-1 text-xs font-bold text-white shadow">
                                Most Popular
                            </span>
                        </div>
                        <div className="mb-6">
                            <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">CMS + Custom Theme</p>
                            <p className="mt-2 text-4xl font-extrabold text-gray-900">
                                Contact Us
                            </p>
                            <p className="mt-1 text-sm text-gray-500">One-time · includes CMS license + theme build</p>
                        </div>
                        <p className="mb-6 text-sm text-gray-600">
                            We design and build a custom Next.js theme for your brand, connect it to your CMS, seed it with your content, and deploy everything for you.
                        </p>
                        <ul className="mb-8 space-y-3 flex-1">
                            {CUSTOM_FEATURES.map((f) => (
                                <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                                    <span className="mt-0.5 text-brand-600">✓</span>
                                    {f}
                                </li>
                            ))}
                        </ul>
                        <a
                            href={CONTACT_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full rounded-xl bg-brand-600 px-6 py-3 text-center font-semibold text-white shadow hover:bg-brand-700 transition"
                        >
                            Get a Quote
                        </a>
                    </div>
                </div>

                {/* Trust strip */}
                <div className="mx-auto mt-10 max-w-2xl rounded-xl bg-gray-50 border border-gray-100 p-6 text-center">
                    <p className="text-sm text-gray-600">
                        Not sure which option is right for you?{' '}
                        <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-600 hover:underline">
                            Talk to us
                        </a>{' '}
                        — we&apos;ll help you figure it out.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
                        <span>✓ One-time payment</span>
                        <span>✓ Source code included</span>
                        <span>✓ Self-hosted — you own your data</span>
                        <span>✓ 1 year of updates</span>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="border-t border-gray-100 px-6 py-20 bg-gray-50">
                <div className="mx-auto max-w-2xl">
                    <h2 className="mb-10 text-center text-2xl font-bold text-gray-900">Frequently asked questions</h2>
                    <div className="space-y-6">
                        {FAQ.map((item) => (
                            <div key={item.q} className="rounded-xl bg-white border border-gray-100 p-6 shadow-sm">
                                <h3 className="mb-2 font-semibold text-gray-900">{item.q}</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="bg-brand-600 px-6 py-14 text-center text-white">
                <h2 className="mb-3 text-2xl font-bold">Start your free demo today</h2>
                <p className="mb-8 text-brand-100">
                    Sign in with Google, GitHub, or LinkedIn — no credit card required.
                </p>
                <Link
                    href="/"
                    className="rounded-xl bg-white px-8 py-3 font-semibold text-brand-700 shadow hover:bg-brand-50 transition inline-block"
                >
                    Try the Demo →
                </Link>
            </section>

            <footer className="border-t border-gray-100 px-6 py-8 text-center text-sm text-gray-400">
                © {new Date().getFullYear()} Blendwit Tech. All rights reserved.{' '}
                <a href="https://blendwit.com" className="hover:text-brand-600">blendwit.com</a>
            </footer>
        </div>
    );
}
