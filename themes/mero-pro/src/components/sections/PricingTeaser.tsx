'use client';

import { useState } from 'react';
import EmblemWatermark from '@/components/ui/EmblemWatermark';
import SectionHeader from '@/components/ui/SectionHeader';
import Button from '@/components/ui/Button';

type Audience = 'personal' | 'organizational';

export interface PricingFeature {
    text: string;
    /** When true, renders the row as "not included" (greyed out, × instead of ✓). */
    excluded?: boolean;
}

export interface PricingTier {
    name: string;
    price: string;
    period: string;
    features: PricingFeature[];
    featured?: boolean;
    ctaText: string;
    ctaHref: string;
}

export interface PricingTeaserData {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    personal?: PricingTier[];
    organizational?: PricingTier[];
}

/* ── DEFAULTS ────────────────────────────────────────────────────
   Exact pricing matrix from the product brief. Personal vs.
   Organizational tracks; each track has Basic / Premium / Pro-or-
   Enterprise / Custom. The middle "Premium" tier is featured in both
   tracks because that's where the bulk of customers land in B2B SaaS. */

const PERSONAL_TIERS: PricingTier[] = [
    {
        name: 'Basic',
        price: 'Rs 20,000',
        period: 'one-time · for individuals starting out',
        features: [
            { text: '1 theme' },
            { text: 'Basic branding' },
            { text: 'Basic settings' },
            { text: 'Blog + theme-related sections' },
            { text: 'DB content management (menus + sections)' },
            { text: 'Basic SEO' },
            { text: 'Plugin support', excluded: true },
            { text: 'Site editor + audit log', excluded: true },
        ],
        ctaText: 'Choose Basic',
        ctaHref: '/signup?tier=personal-basic',
    },
    {
        name: 'Premium',
        price: 'Rs 35,000',
        period: 'one-time · the popular choice',
        featured: true,
        features: [
            { text: '3 themes' },
            { text: 'Plugin support (paid plugins)' },
            { text: 'Proper branding' },
            { text: 'Proper settings' },
            { text: 'Theme-related sections' },
            { text: 'DB content management (menus + sections)' },
            { text: 'Complete SEO + analytics' },
            { text: 'Audit log' },
            { text: 'All site editor + site pages' },
        ],
        ctaText: 'Choose Premium',
        ctaHref: '/signup?tier=personal-premium',
    },
    {
        name: 'Professional',
        price: 'Rs 65k–85k',
        period: 'one-time · for power users',
        features: [
            { text: 'Customised theme (or fully built new theme)' },
            { text: 'Everything in Premium' },
            { text: 'Theme code editing (WordPress-style)' },
            { text: 'Webhooks + collections + forms' },
            { text: 'Analytics dashboard' },
            { text: 'Complete settings' },
            { text: 'Theme editor (component-level customisation)' },
        ],
        ctaText: 'Choose Professional',
        ctaHref: '/signup?tier=personal-professional',
    },
    {
        name: 'Custom',
        price: 'Rs 1,00,000+',
        period: 'one-time · custom-built for you',
        features: [
            { text: 'Custom package as you require' },
            { text: 'Direct consultation with the Mero team' },
            { text: 'Bespoke theme + integrations' },
            { text: 'Priority support' },
            { text: 'Tailored deployment + onboarding' },
        ],
        ctaText: 'Talk to us',
        ctaHref: '/contact?tier=personal-custom',
    },
];

const ORGANIZATIONAL_TIERS: PricingTier[] = [
    {
        name: 'Basic',
        price: 'Rs 35,000',
        period: 'one-time · for small teams',
        features: [
            { text: '1 theme' },
            { text: 'Basic branding' },
            { text: 'Basic settings' },
            { text: 'Blog + theme-related sections' },
            { text: 'DB content management (menus + sections)' },
            { text: 'Basic SEO' },
            { text: 'Plugin support', excluded: true },
            { text: 'Site editor + audit log', excluded: true },
        ],
        ctaText: 'Choose Basic',
        ctaHref: '/signup?tier=org-basic',
    },
    {
        name: 'Premium',
        price: 'Rs 60k–80k',
        period: 'one-time · the popular choice',
        featured: true,
        features: [
            { text: '3 themes' },
            { text: 'Plugin support (paid plugins)' },
            { text: 'Proper branding' },
            { text: 'Proper settings' },
            { text: 'Theme-related sections' },
            { text: 'DB content management (menus + sections)' },
            { text: 'Complete SEO + analytics' },
            { text: 'Audit log' },
            { text: 'All site editor + site pages' },
        ],
        ctaText: 'Choose Premium',
        ctaHref: '/signup?tier=org-premium',
    },
    {
        name: 'Enterprise',
        price: 'Rs 1,00,000–1,50,000',
        period: 'one-time · for organisations',
        features: [
            { text: 'Customised theme (or fully built new theme)' },
            { text: 'Everything in Premium' },
            { text: 'Theme code editing (WordPress-style)' },
            { text: 'Webhooks + collections + forms' },
            { text: 'Analytics dashboard' },
            { text: 'Complete settings' },
            { text: 'Theme editor (component-level customisation)' },
            { text: 'CMS dashboard branding (colour + font)' },
        ],
        ctaText: 'Choose Enterprise',
        ctaHref: '/signup?tier=org-enterprise',
    },
    {
        name: 'Custom',
        price: 'Rs 1,85,000+',
        period: 'one-time · custom-built for you',
        features: [
            { text: 'Custom package as you require' },
            { text: 'Direct consultation with the Mero team' },
            { text: 'Bespoke theme + integrations' },
            { text: 'Priority support + SLA' },
            { text: 'Tailored deployment + onboarding' },
            { text: 'Multi-site / multi-region setups' },
        ],
        ctaText: 'Talk to us',
        ctaHref: '/contact?tier=org-custom',
    },
];

/**
 * Pricing teaser with audience toggle.
 *
 * Top of section: a Personal / Organizational pill toggle (defaults
 * to Personal). Below: 4 tier cards for the active audience. The
 * "Premium" tier is featured in both tracks (dark slab + MOST POPULAR
 * badge). One-time prices in NPR — Mero CMS is licence-based, not a
 * subscription.
 *
 * Client component because of the audience toggle state. CMS data
 * can override either track via `data.personal` / `data.organizational`.
 */
export default function PricingTeaser({ data = {} }: { data?: PricingTeaserData }) {
    const [audience, setAudience] = useState<Audience>('personal');

    const personalTiers = data.personal?.length ? data.personal : PERSONAL_TIERS;
    const organizationalTiers = data.organizational?.length ? data.organizational : ORGANIZATIONAL_TIERS;
    const tiers = audience === 'personal' ? personalTiers : organizationalTiers;

    return (
        <section data-section-id="pricing" className="pricing has-watermark" id="pricing">
            <EmblemWatermark position="bl" />
            <div className="container">
                <SectionHeader
                    eyebrow={data.eyebrow || 'Pricing'}
                    title={
                        <>
                            Pay for the tier.{' '}
                            <span className="serif-em" style={{ color: 'var(--brand)' }}>
                                Own the stack.
                            </span>
                        </>
                    }
                    subtitle={
                        data.subtitle ||
                        'One-time licence, lifetime updates for the major version, transparent capability gating — no per-seat creep.'
                    }
                />

                {/* Audience toggle — Personal vs Organisational */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div className="audience-toggle" role="tablist" aria-label="Pricing audience">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={audience === 'personal'}
                            className={audience === 'personal' ? 'active' : ''}
                            onClick={() => setAudience('personal')}
                        >
                            Personal
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={audience === 'organizational'}
                            className={audience === 'organizational' ? 'active' : ''}
                            onClick={() => setAudience('organizational')}
                        >
                            Organizational
                        </button>
                    </div>
                </div>

                <div className="pricing-grid">
                    {tiers.map(tier => {
                        // Defensive — admin-authored tiers may omit any
                        // field. Fall back to safe values rather than
                        // crashing the whole pricing section on .map of
                        // an undefined features array.
                        const features = Array.isArray(tier.features) ? tier.features : [];
                        return (
                            <div key={tier.name || tier.id} className={`price-card ${tier.featured ? 'featured' : ''}`}>
                                <div className="price-tier">{tier.name}</div>
                                <div className="price-amount">{tier.price}</div>
                                {tier.period && <div className="price-period">{tier.period}</div>}
                                {features.length > 0 && (
                                    <ul className="price-features">
                                        {features.map((feat, i) => (
                                            <li key={i} className={feat?.excluded ? 'no' : undefined}>
                                                {typeof feat === 'string' ? feat : feat?.text}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {tier.ctaText && (
                                    <Button
                                        href={tier.ctaHref || '#'}
                                        variant={tier.featured ? 'brand' : 'light'}
                                        style={{ width: '100%' }}
                                    >
                                        {tier.ctaText}
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>

                <p
                    style={{
                        textAlign: 'center',
                        fontSize: 13,
                        color: 'var(--ink-3)',
                        marginTop: 32,
                    }}
                >
                    Need something different?{' '}
                    <a href="/contact" style={{ color: 'var(--brand)', fontWeight: 600 }}>
                        Talk to us about a custom package →
                    </a>
                </p>
            </div>
        </section>
    );
}
