'use client';

import { useState } from 'react';
import Button from '../../components/ui/Button';
import { submitLead, submitForm } from '../../lib/api';

/**
 * Contact form — submits via /public/leads by default (lightweight
 * lead capture endpoint, no formId needed). Optionally accepts a
 * `formId` prop to submit through /public/forms/:formId/submit instead,
 * which routes through the admin's form-builder pipeline (custom
 * fields + webhook delivery).
 *
 * Client-component because we manage form state, show loading + success
 * states, and prevent default submission. Backend rate-limits to
 * 10 requests/min per IP — surfaces as a 429 with a helpful message.
 */
type FormState = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactForm({ formId }: { formId?: string } = {}) {
    const [state, setState] = useState<FormState>('idle');
    const [errorMsg, setErrorMsg] = useState<string>('');

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
        setState('submitting');
        setErrorMsg('');

        try {
            if (formId) {
                // Submit through the admin's form-builder pipeline. Field
                // names must match the form's schema (defined in admin).
                await submitForm(formId, data);
            } else {
                // Default path: a lightweight lead. Maps the standard
                // contact fields onto the /public/leads body.
                await submitLead({
                    name: data.name,
                    email: data.email,
                    phone: data.phone || undefined,
                    message: data.message,
                    source: 'contact-page',
                });
            }
            setState('success');
            (e.target as HTMLFormElement).reset();
        } catch (err) {
            setState('error');
            setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
        }
    };

    if (state === 'success') {
        return (
            <div
                style={{
                    background: '#fff',
                    border: '1px solid var(--paper-3)',
                    borderRadius: 'var(--r-md)',
                    padding: '40px 32px',
                    textAlign: 'center',
                }}
            >
                <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                <h3 className="display" style={{ fontSize: 24, marginBottom: 8 }}>
                    Thanks — we’ll be in touch.
                </h3>
                <p style={{ color: 'var(--ink-3)', fontSize: 15 }}>
                    Most messages get a reply within 24 hours. Enterprise inquiries get triaged the same day.
                </p>
            </div>
        );
    }

    return (
        <form
            onSubmit={onSubmit}
            style={{
                background: '#fff',
                border: '1px solid var(--paper-3)',
                borderRadius: 'var(--r-md)',
                padding: 32,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
            }}
        >
            <Field label="Your name" name="name" required type="text" placeholder="Alex Marker" />
            <Field label="Work email" name="email" required type="email" placeholder="alex@company.com" />
            <Field label="Company" name="company" type="text" placeholder="Acme Inc." />
            <Field
                label="What can we help with?"
                name="message"
                required
                textarea
                placeholder="Tell us about your team and what you’re evaluating Mero CMS for…"
            />

            {state === 'error' && (
                <div
                    style={{
                        color: 'var(--brand-deep)',
                        fontSize: 14,
                        background: 'rgba(203,23,43,0.06)',
                        border: '1px solid rgba(203,23,43,0.18)',
                        padding: '10px 12px',
                        borderRadius: 8,
                    }}
                >
                    {errorMsg || 'Something went wrong. Please try again.'}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                <Button type="submit" variant="brand" size="lg">
                    {state === 'submitting' ? 'Sending…' : 'Send message →'}
                </Button>
            </div>
        </form>
    );
}

/** Reusable form field — text input or textarea. */
function Field({
    label,
    name,
    type = 'text',
    placeholder,
    required,
    textarea,
}: {
    label: string;
    name: string;
    type?: 'text' | 'email';
    placeholder?: string;
    required?: boolean;
    textarea?: boolean;
}) {
    const baseStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px 14px',
        fontSize: 15,
        fontFamily: 'inherit',
        color: 'var(--ink)',
        background: '#fff',
        border: '1px solid var(--paper-3)',
        borderRadius: 12,
        transition: 'border-color .15s ease, box-shadow .15s ease',
        outline: 'none',
    };

    return (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>{label}</span>
            {textarea ? (
                <textarea
                    name={name}
                    required={required}
                    placeholder={placeholder}
                    rows={5}
                    style={{ ...baseStyle, resize: 'vertical', minHeight: 120 }}
                />
            ) : (
                <input type={type} name={name} required={required} placeholder={placeholder} style={baseStyle} />
            )}
        </label>
    );
}
