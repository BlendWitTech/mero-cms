'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { PackagesConfigRecord } from '@/lib/api';

/**
 * Pricing table with personal/organizational toggle.
 *
 * Each tier card shows the one-time license price, optional annual
 * maintenance fee, the tagline, key features, and a CTA. Custom tier
 * shows "Starting at NPR X" using priceFromNPR as the anchor.
 *
 * The toggle is the only interactive piece — everything else is
 * pulled from the backend's packages-config endpoint at request time
 * (which the server component fetches and passes in as props).
 */

interface Props {
    personalTiers: PackagesConfigRecord[];
    orgTiers: PackagesConfigRecord[];
}

const formatNPR = (n: number) =>
    new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);

const renderPrice = (pkg: PackagesConfigRecord) => {
    if (pkg.priceNPR === 'custom') {
        return {
            primary: 'Custom',
            sub: pkg.priceFromNPR ? `Starting at NPR ${formatNPR(pkg.priceFromNPR)}` : 'Talk to sales',
        };
    }
    return {
        primary: `NPR ${formatNPR(pkg.priceNPR as number)}`,
        sub: 'one-time licence',
    };
};

export default function PricingTable({ personalTiers, orgTiers }: Props) {
    const [websiteType, setWebsiteType] = useState<'personal' | 'organizational'>('personal');
    const tiers = websiteType === 'personal' ? personalTiers : orgTiers;

    return (
        <section className="section" style={{ paddingTop: 24 }}>
            <div className="container">
                {/* Toggle */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
                    <div
                        role="tablist"
                        style={{
                            display: 'inline-flex',
                            padding: 4,
                            background: 'var(--paper-2)',
                            borderRadius: 100,
                            border: '1px solid var(--paper-3)',
                        }}
                    >
                        {(['personal', 'organizational'] as const).map(t => (
                            <button
                                key={t}
                                role="tab"
                                aria-selected={websiteType === t}
                                onClick={() => setWebsiteType(t)}
                                style={{
                                    appearance: 'none',
                                    border: 'none',
                                    background: websiteType === t ? '#fff' : 'transparent',
                                    color: websiteType === t ? 'var(--ink)' : 'var(--ink-3)',
                                    padding: '12px 28px',
                                    borderRadius: 100,
                                    fontWeight: 700,
                                    fontSize: 14,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: websiteType === t ? 'var(--shadow-sm)' : 'none',
                                }}
                            >
                                {t === 'personal' ? 'Personal' : 'Organizational'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tier cards */}
                <div
                    style={{
                        display: 'grid',
                        gap: 20,
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    }}
                >
                    {tiers.map(pkg => {
                        const { primary, sub } = renderPrice(pkg);
                        const featured = !!pkg.highlighted;
                        return (
                            <article
                                key={pkg.id}
                                style={{
                                    position: 'relative',
                                    background: featured ? 'var(--ink)' : '#fff',
                                    color: featured ? '#fff' : 'var(--ink)',
                                    border: featured
                                        ? '2px solid var(--brand)'
                                        : '1px solid var(--paper-3)',
                                    borderRadius: 'var(--r-lg)',
                                    padding: '28px 24px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 18,
                                    minHeight: 480,
                                }}
                            >
                                {featured && (
                                    <span
                                        style={{
                                            position: 'absolute',
                                            top: -12,
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            background: 'var(--brand)',
                                            color: '#fff',
                                            fontSize: 10,
                                            fontWeight: 800,
                                            letterSpacing: '0.08em',
                                            textTransform: 'uppercase',
                                            padding: '5px 12px',
                                            borderRadius: 100,
                                        }}
                                    >
                                        Most popular
                                    </span>
                                )}

                                <header>
                                    <p
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 800,
                                            letterSpacing: '0.12em',
                                            textTransform: 'uppercase',
                                            color: featured ? 'rgba(255,255,255,0.5)' : 'var(--ink-4)',
                                            marginBottom: 6,
                                        }}
                                    >
                                        Tier {pkg.tier}
                                    </p>
                                    <h3
                                        className="display"
                                        style={{
                                            fontSize: 26,
                                            letterSpacing: '-0.02em',
                                            marginBottom: 4,
                                        }}
                                    >
                                        {pkg.name}
                                    </h3>
                                    <p
                                        style={{
                                            fontSize: 13,
                                            color: featured ? 'rgba(255,255,255,0.65)' : 'var(--ink-3)',
                                            lineHeight: 1.5,
                                            minHeight: 38,
                                        }}
                                    >
                                        {pkg.tagline}
                                    </p>
                                </header>

                                {/* Price block */}
                                <div>
                                    <div
                                        style={{
                                            fontFamily: 'var(--font-display)',
                                            fontSize: 32,
                                            fontWeight: 800,
                                            letterSpacing: '-0.02em',
                                            lineHeight: 1,
                                        }}
                                    >
                                        {primary}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 600,
                                            letterSpacing: '0.06em',
                                            textTransform: 'uppercase',
                                            color: featured ? 'rgba(255,255,255,0.55)' : 'var(--ink-4)',
                                            marginTop: 6,
                                        }}
                                    >
                                        {sub}
                                    </div>
                                    {pkg.maintenanceNPR && pkg.priceNPR !== 'custom' && (
                                        <div
                                            style={{
                                                fontSize: 11,
                                                color: featured ? 'rgba(255,255,255,0.6)' : 'var(--ink-3)',
                                                marginTop: 8,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                            }}
                                        >
                                            <span style={{ opacity: 0.6 }}>+</span>
                                            <span>NPR {formatNPR(pkg.maintenanceNPR)}/yr maintenance</span>
                                            <span
                                                title="Optional. Covers security patches and version upgrades. You can let it lapse and keep using your version."
                                                style={{ cursor: 'help', opacity: 0.5 }}
                                            >
                                                ⓘ
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Features */}
                                <ul
                                    style={{
                                        listStyle: 'none',
                                        padding: 0,
                                        margin: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 10,
                                        flex: 1,
                                    }}
                                >
                                    {pkg.features.slice(0, 8).map((f, i) => (
                                        <li
                                            key={i}
                                            style={{
                                                fontSize: 13,
                                                lineHeight: 1.45,
                                                display: 'flex',
                                                gap: 8,
                                                color: featured ? 'rgba(255,255,255,0.85)' : 'var(--ink-2)',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    color: featured ? 'var(--brand)' : 'var(--brand)',
                                                    fontWeight: 800,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                ✓
                                            </span>
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                <Link
                                    href={pkg.priceNPR === 'custom' ? '/contact' : `/signup?package=${pkg.id}`}
                                    style={{
                                        display: 'block',
                                        textAlign: 'center',
                                        background: featured ? 'var(--brand)' : 'var(--ink)',
                                        color: '#fff',
                                        padding: '13px 22px',
                                        borderRadius: 100,
                                        fontWeight: 700,
                                        fontSize: 14,
                                        textDecoration: 'none',
                                        transition: 'transform 0.15s ease',
                                    }}
                                >
                                    {pkg.priceNPR === 'custom' ? 'Talk to sales' : `Buy ${pkg.name}`}
                                </Link>
                            </article>
                        );
                    })}
                </div>

                <p
                    style={{
                        textAlign: 'center',
                        marginTop: 28,
                        fontSize: 13,
                        color: 'var(--ink-3)',
                    }}
                >
                    Maintenance is optional — your CMS keeps working without it. Only future version upgrades require an active subscription.
                </p>
            </div>
        </section>
    );
}
