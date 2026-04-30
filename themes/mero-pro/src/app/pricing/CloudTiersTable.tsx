import React from 'react';
import Link from 'next/link';
import type { CloudTierRecord } from '@/lib/api';

/**
 * Mero Cloud add-on table — managed hosting tiers, sold annually
 * alongside the one-time CMS license. Server-rendered (no toggle,
 * no interactivity) so it keeps page weight light.
 *
 * Sourced from /public/cloud-tiers which exposes the CLOUD_TIERS
 * config straight from packages.ts.
 */

interface Props {
    tiers: CloudTierRecord[];
}

const formatNPR = (n: number) =>
    new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);

export default function CloudTiersTable({ tiers }: Props) {
    return (
        <section
            className="section"
            style={{
                paddingTop: 60,
                paddingBottom: 60,
                background: 'linear-gradient(180deg, var(--paper) 0%, var(--paper-2) 100%)',
            }}
        >
            <div className="container">
                <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 48px' }}>
                    <p
                        style={{
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: '0.16em',
                            textTransform: 'uppercase',
                            color: 'var(--brand)',
                            marginBottom: 12,
                        }}
                    >
                        Mero Cloud · managed hosting
                    </p>
                    <h2
                        className="display"
                        style={{
                            fontSize: 'clamp(28px, 4vw, 44px)',
                            letterSpacing: '-0.02em',
                            marginBottom: 14,
                        }}
                    >
                        Or let us host it for you.
                    </h2>
                    <p style={{ fontSize: 16, color: 'var(--ink-3)', lineHeight: 1.55 }}>
                        Same Mero CMS, on infrastructure we manage. One URL, free SSL, daily backups, and you never think about Linux again. Sold annually as an add-on to any one-time licence.
                    </p>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gap: 18,
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    }}
                >
                    {tiers.map(tier => (
                        <article
                            key={tier.id}
                            style={{
                                background: '#fff',
                                border: '1px solid var(--paper-3)',
                                borderRadius: 'var(--r-lg)',
                                padding: '28px 24px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 16,
                            }}
                        >
                            <header>
                                <h3
                                    className="display"
                                    style={{
                                        fontSize: 22,
                                        letterSpacing: '-0.02em',
                                        marginBottom: 6,
                                    }}
                                >
                                    {tier.name}
                                </h3>
                                <p
                                    style={{
                                        fontSize: 13,
                                        color: 'var(--ink-3)',
                                        lineHeight: 1.5,
                                        minHeight: 40,
                                    }}
                                >
                                    {tier.tagline}
                                </p>
                            </header>

                            <div>
                                <div
                                    style={{
                                        fontFamily: 'var(--font-display)',
                                        fontSize: 30,
                                        fontWeight: 800,
                                        letterSpacing: '-0.02em',
                                        lineHeight: 1,
                                    }}
                                >
                                    NPR {formatNPR(tier.annualNPR)}
                                </div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        letterSpacing: '0.06em',
                                        textTransform: 'uppercase',
                                        color: 'var(--ink-4)',
                                        marginTop: 6,
                                    }}
                                >
                                    per year
                                </div>
                            </div>

                            {/* Stat strip */}
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: 8,
                                    padding: '12px 0',
                                    borderTop: '1px solid var(--paper-2)',
                                    borderBottom: '1px solid var(--paper-2)',
                                }}
                            >
                                <Stat label="Sites" value={tier.sites === -1 ? '∞' : String(tier.sites)} />
                                <Stat label="Storage" value={`${tier.storageLimitGB}GB`} />
                                <Stat label="Backups" value={`${tier.backupRetentionDays}d`} />
                            </div>

                            <ul
                                style={{
                                    listStyle: 'none',
                                    padding: 0,
                                    margin: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 8,
                                    flex: 1,
                                }}
                            >
                                {tier.features.map((f, i) => (
                                    <li
                                        key={i}
                                        style={{
                                            fontSize: 12,
                                            lineHeight: 1.45,
                                            display: 'flex',
                                            gap: 7,
                                            color: 'var(--ink-2)',
                                        }}
                                    >
                                        <span style={{ color: 'var(--brand)', fontWeight: 800, flexShrink: 0 }}>✓</span>
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={`/contact?cloud=${tier.id}`}
                                style={{
                                    display: 'block',
                                    textAlign: 'center',
                                    background: 'var(--ink)',
                                    color: '#fff',
                                    padding: '12px 22px',
                                    borderRadius: 100,
                                    fontWeight: 700,
                                    fontSize: 13,
                                    textDecoration: 'none',
                                }}
                            >
                                Add {tier.name}
                            </Link>
                        </article>
                    ))}
                </div>

                <p
                    style={{
                        textAlign: 'center',
                        marginTop: 28,
                        fontSize: 13,
                        color: 'var(--ink-3)',
                    }}
                >
                    Cloud requires an active CMS licence. Migrate from self-hosted in one click — your content moves with you.
                </p>
            </div>
        </section>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <div
                style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: 'var(--ink)',
                    fontFamily: 'var(--font-display)',
                }}
            >
                {value}
            </div>
            <div
                style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-4)',
                    marginTop: 2,
                }}
            >
                {label}
            </div>
        </div>
    );
}
