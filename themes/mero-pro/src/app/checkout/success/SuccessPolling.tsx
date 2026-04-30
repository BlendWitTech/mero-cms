'use client';

import React, { useEffect, useState } from 'react';
import { getOrder, type OrderStatusRecord } from '@/lib/api';

interface Props {
    orderId: string;
    providerOrderId?: string;
}

/**
 * Poll the order status while the webhook is in flight. Stops when:
 *   • Status leaves 'pending' (paid / failed / cancelled / refunded)
 *   • Or after MAX_ATTEMPTS (≈ 60s) — at which point we tell the
 *     customer to check email; the webhook may still arrive later.
 *
 * Once paid, we render the license key prominently with copy-to-
 * clipboard and instructions to use it in the setup wizard.
 */
const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 30; // 60s total

export default function SuccessPolling({ orderId, providerOrderId }: Props) {
    const [order, setOrder] = useState<OrderStatusRecord | null>(null);
    const [attempts, setAttempts] = useState(0);
    const [stopped, setStopped] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!orderId) {
            setStopped(true);
            return;
        }

        let cancelled = false;
        let attempt = 0;

        const poll = async () => {
            attempt += 1;
            setAttempts(attempt);
            try {
                const o = await getOrder(orderId);
                if (cancelled) return;
                if (o) {
                    setOrder(o);
                    if (o.status !== 'pending') {
                        setStopped(true);
                        return;
                    }
                }
            } catch { /* fall through to retry */ }

            if (attempt >= MAX_ATTEMPTS) {
                setStopped(true);
                return;
            }
            setTimeout(poll, POLL_INTERVAL_MS);
        };

        poll();
        return () => { cancelled = true; };
    }, [orderId]);

    const handleCopy = () => {
        if (!order?.licenseKey) return;
        navigator.clipboard.writeText(order.licenseKey).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <section className="section" style={{ paddingTop: 32 }}>
            <div className="container" style={{ maxWidth: 720 }}>
                {!orderId && (
                    <Box title="Missing order ID">
                        <p>
                            We couldn't find the order in this URL. If you just paid, check your inbox — the receipt email contains your license key.
                            {providerOrderId && (
                                <>
                                    {' '}Reference: <code style={{ fontFamily: 'monospace' }}>{providerOrderId}</code>.
                                </>
                            )}
                        </p>
                    </Box>
                )}

                {orderId && !stopped && (
                    <Box title="Confirming payment…">
                        <p>
                            Checking with the payment provider. <span style={{ opacity: 0.6 }}>(attempt {attempts}/{MAX_ATTEMPTS})</span>
                        </p>
                        <div className="loader" style={{ marginTop: 16 }}>
                            <div
                                style={{
                                    height: 4,
                                    width: '100%',
                                    background: 'var(--paper-3)',
                                    borderRadius: 100,
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    style={{
                                        height: '100%',
                                        width: `${Math.min(100, (attempts / MAX_ATTEMPTS) * 100)}%`,
                                        background: 'var(--brand)',
                                        transition: 'width 0.4s ease',
                                    }}
                                />
                            </div>
                        </div>
                    </Box>
                )}

                {orderId && stopped && order?.status === 'paid' && order.licenseKey && (
                    <>
                        <Box title="Payment confirmed">
                            <p>
                                Thanks, {order.customerEmail}. Your license is ready below. We've also emailed it to you.
                            </p>
                        </Box>

                        <div
                            style={{
                                marginTop: 16,
                                background: 'var(--ink)',
                                color: '#fff',
                                borderRadius: 'var(--r-lg)',
                                padding: 24,
                            }}
                        >
                            <p
                                style={{
                                    fontSize: 11,
                                    fontWeight: 800,
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    color: 'rgba(255,255,255,0.55)',
                                    marginBottom: 10,
                                }}
                            >
                                Your license key
                            </p>
                            <pre
                                style={{
                                    fontFamily: 'monospace',
                                    fontSize: 11,
                                    lineHeight: 1.6,
                                    background: 'rgba(255,255,255,0.06)',
                                    padding: 14,
                                    borderRadius: 12,
                                    overflowX: 'auto',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all',
                                    margin: 0,
                                }}
                            >
                                {order.licenseKey}
                            </pre>
                            <button
                                onClick={handleCopy}
                                style={{
                                    marginTop: 12,
                                    background: 'var(--brand)',
                                    color: '#fff',
                                    padding: '10px 18px',
                                    borderRadius: 100,
                                    fontWeight: 700,
                                    fontSize: 12,
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                {copied ? 'Copied ✓' : 'Copy to clipboard'}
                            </button>
                        </div>

                        <Box title="Next steps" style={{ marginTop: 16 }}>
                            <ol style={{ paddingLeft: 20, lineHeight: 1.7 }}>
                                <li>Download Mero CMS (or finish your setup wizard if you've started one).</li>
                                <li>Run <code>npm run start:all</code>. The wizard auto-launches.</li>
                                <li>Walk through Welcome → Database → License & Modules. Paste the key above on the License step.</li>
                                <li>You're done. The CMS unlocks the full feature set for your tier immediately.</li>
                            </ol>
                        </Box>
                    </>
                )}

                {orderId && stopped && order && order.status !== 'paid' && (
                    <Box title={statusTitle(order.status)} tone="warn">
                        <p>{statusMessage(order)}</p>
                        <p style={{ marginTop: 12 }}>
                            Reference order: <code>{order.id}</code>
                        </p>
                    </Box>
                )}

                {orderId && stopped && !order && (
                    <Box title="Still confirming" tone="warn">
                        <p>
                            We didn't hear back from the provider in time. If you completed the payment, we'll send the license key by email shortly. Reference: <code>{orderId}</code>.
                        </p>
                    </Box>
                )}
            </div>
        </section>
    );
}

function Box({
    title,
    children,
    tone,
    style,
}: {
    title: string;
    children: React.ReactNode;
    tone?: 'warn';
    style?: React.CSSProperties;
}) {
    return (
        <div
            style={{
                background: '#fff',
                border: '1px solid',
                borderColor: tone === 'warn' ? 'rgba(203,23,43,0.3)' : 'var(--paper-3)',
                borderRadius: 'var(--r-lg)',
                padding: 24,
                ...style,
            }}
        >
            <h3
                className="display"
                style={{
                    fontSize: 22,
                    marginBottom: 8,
                    color: tone === 'warn' ? 'var(--brand-deep)' : 'var(--ink)',
                }}
            >
                {title}
            </h3>
            <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55 }}>{children}</div>
        </div>
    );
}

function statusTitle(status: string) {
    switch (status) {
        case 'failed': return 'Payment failed';
        case 'cancelled': return 'Payment cancelled';
        case 'refunded': return 'Order refunded';
        default: return 'Order status';
    }
}

function statusMessage(order: OrderStatusRecord) {
    switch (order.status) {
        case 'failed':
            return order.failureReason
                ? `${order.failureReason} — please try again or use a different payment method.`
                : 'The payment was declined. Please try again or use a different payment method.';
        case 'cancelled':
            return 'You cancelled the payment before it completed. No charge was made.';
        case 'refunded':
            return 'This order was refunded. No license is active for this purchase.';
        default:
            return `Status: ${order.status}.`;
    }
}
