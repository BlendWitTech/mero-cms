'use client';

import React, { useState } from 'react';
import { createOrder, type PaymentProviderRecord, type PackagesConfigRecord, type CloudTierRecord } from '@/lib/api';

interface Props {
    itemType: 'package' | 'cloud-tier';
    itemId: string;
    itemName: string;
    amountNPR: number;
    providers: PaymentProviderRecord[];
    pkg?: PackagesConfigRecord;
    cloud?: CloudTierRecord;
}

const formatNPR = (n: number) => new Intl.NumberFormat('en-IN').format(n);

/**
 * Checkout form. Collects email + name, lets the customer pick a
 * payment provider that's actually configured on this deployment,
 * then POSTs to /payments/orders. The backend returns a redirectUrl
 * (Stripe, Khalti) or a form-post target (eSewa); we handle both.
 *
 * For eSewa we auto-submit a form to their endpoint with the signed
 * fields the backend returned. For everyone else, window.location.assign
 * to the redirect URL.
 */
export default function CheckoutForm({
    itemType,
    itemId,
    itemName,
    amountNPR,
    providers,
    pkg,
    cloud,
}: Props) {
    const [email, setEmail]       = useState('');
    const [name, setName]         = useState('');
    const [phone, setPhone]       = useState('');
    const [provider, setProvider] = useState<PaymentProviderRecord['id']>(
        providers[0]?.id || 'khalti',
    );
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]       = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!email.trim() || !name.trim()) {
            setError('Email and name are required.');
            return;
        }
        if (providers.length === 0) {
            setError("No payment providers are configured on this deployment. Email sales@mero.cms instead.");
            return;
        }

        setSubmitting(true);
        try {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const orderId = `pending-${Date.now()}`; // replaced by real id below
            const result = await createOrder({
                customerEmail: email.trim(),
                customerName: name.trim(),
                customerPhone: phone.trim() || undefined,
                itemType,
                packageId: itemType === 'package' ? itemId : undefined,
                cloudTierId: itemType === 'cloud-tier' ? itemId : undefined,
                amountNPR,
                provider,
                successUrl: `${origin}/checkout/success?orderId={ORDER_ID}`,
                cancelUrl:  `${origin}/checkout?cancelled=1&package=${itemId}`,
            });

            // Replace the placeholder with the real order id so the
            // success page can poll. Providers that don't substitute
            // {ORDER_ID} themselves still work because we'll look it
            // up via providerOrderId in the webhook.
            const successUrlReal = result.redirectUrl?.replace(/\{ORDER_ID\}/g, result.orderId);
            void orderId;

            if (result.redirectUrl && result.formParams) {
                // eSewa-style: build a hidden form and submit it. Their
                // checkout requires POST, not GET.
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = successUrlReal || result.redirectUrl;
                Object.entries(result.formParams).forEach(([k, v]) => {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = k;
                    input.value = String(v);
                    form.appendChild(input);
                });
                document.body.appendChild(form);
                form.submit();
            } else if (result.redirectUrl) {
                window.location.assign(successUrlReal || result.redirectUrl);
            } else {
                // Provider-side failure that didn't throw — rare.
                setError("Couldn't start payment. Please try again or contact support.");
            }
        } catch (err: any) {
            setError(err?.message || 'Could not start payment.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="section" style={{ paddingTop: 32 }}>
            <div className="container" style={{ maxWidth: 720 }}>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1fr) 280px',
                        gap: 32,
                        alignItems: 'start',
                    }}
                >
                    {/* Form */}
                    <form
                        onSubmit={handleSubmit}
                        style={{
                            background: '#fff',
                            border: '1px solid var(--paper-3)',
                            borderRadius: 'var(--r-lg)',
                            padding: 28,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 18,
                        }}
                    >
                        <Field label="Email" required>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                disabled={submitting}
                                style={inputStyle}
                            />
                        </Field>
                        <Field label="Full name" required>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Saugat Pahari"
                                disabled={submitting}
                                style={inputStyle}
                            />
                        </Field>
                        <Field label="Phone (optional)">
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="+977 …"
                                disabled={submitting}
                                style={inputStyle}
                            />
                        </Field>

                        {/* Payment provider */}
                        <div>
                            <span style={labelStyle}>Payment method</span>
                            {providers.length === 0 ? (
                                <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                                    No payment providers are configured on this deployment yet.
                                </p>
                            ) : (
                                <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                                    {providers.map(p => (
                                        <label
                                            key={p.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                                padding: '12px 14px',
                                                borderRadius: 12,
                                                border: '1px solid',
                                                borderColor:
                                                    provider === p.id ? 'var(--brand)' : 'var(--paper-3)',
                                                cursor: 'pointer',
                                                background:
                                                    provider === p.id ? 'rgba(203,23,43,0.04)' : '#fff',
                                                transition: 'all 0.15s ease',
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name="provider"
                                                checked={provider === p.id}
                                                onChange={() => setProvider(p.id)}
                                                disabled={submitting}
                                                style={{ accentColor: 'var(--brand)' }}
                                            />
                                            <span style={{ fontSize: 14, fontWeight: 600 }}>
                                                {p.displayName}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    color: 'var(--ink-4)',
                                                    marginLeft: 'auto',
                                                    fontFamily: 'monospace',
                                                }}
                                            >
                                                {p.currencies.join(' / ')}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {error && (
                            <div
                                style={{
                                    background: 'rgba(203,23,43,0.06)',
                                    border: '1px solid rgba(203,23,43,0.2)',
                                    color: 'var(--brand-deep)',
                                    padding: 12,
                                    borderRadius: 8,
                                    fontSize: 13,
                                }}
                            >
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting || providers.length === 0}
                            style={{
                                background: 'var(--ink)',
                                color: '#fff',
                                padding: '14px 22px',
                                borderRadius: 100,
                                fontWeight: 700,
                                fontSize: 14,
                                border: 'none',
                                cursor: submitting ? 'wait' : 'pointer',
                                opacity: submitting || providers.length === 0 ? 0.6 : 1,
                            }}
                        >
                            {submitting ? 'Redirecting to payment…' : `Pay NPR ${formatNPR(amountNPR)}`}
                        </button>

                        <p style={{ fontSize: 11, color: 'var(--ink-4)', textAlign: 'center' }}>
                            Secure checkout. We don't store card details. Refund within 14 days if unused.
                        </p>
                    </form>

                    {/* Order summary sidebar */}
                    <aside
                        style={{
                            background: 'var(--paper-2)',
                            borderRadius: 'var(--r-lg)',
                            padding: 24,
                            border: '1px solid var(--paper-3)',
                            position: 'sticky',
                            top: 24,
                        }}
                    >
                        <p
                            style={{
                                fontSize: 10,
                                fontWeight: 800,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                color: 'var(--ink-4)',
                                marginBottom: 12,
                            }}
                        >
                            Order summary
                        </p>
                        <h3 className="display" style={{ fontSize: 22, marginBottom: 6 }}>
                            {itemName}
                        </h3>
                        {pkg && (
                            <p style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 16 }}>
                                {pkg.tagline}
                            </p>
                        )}
                        {cloud && (
                            <p style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 16 }}>
                                {cloud.tagline}
                            </p>
                        )}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                paddingTop: 12,
                                borderTop: '1px solid var(--paper-3)',
                                fontWeight: 700,
                                fontSize: 18,
                            }}
                        >
                            <span>Total</span>
                            <span>NPR {formatNPR(amountNPR)}</span>
                        </div>
                        <p
                            style={{
                                fontSize: 11,
                                color: 'var(--ink-4)',
                                marginTop: 8,
                            }}
                        >
                            {itemType === 'package' ? 'one-time licence' : 'annual'}
                        </p>
                    </aside>
                </div>
            </div>
        </section>
    );
}

const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--ink-2)',
    display: 'block',
    marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    fontSize: 14,
    fontFamily: 'inherit',
    color: 'var(--ink)',
    background: '#fff',
    border: '1px solid var(--paper-3)',
    borderRadius: 12,
    outline: 'none',
};

function Field({
    label,
    required,
    children,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <label style={{ display: 'block' }}>
            <span style={labelStyle}>
                {label}
                {required && <span style={{ color: 'var(--brand)', marginLeft: 4 }}>*</span>}
            </span>
            {children}
        </label>
    );
}
