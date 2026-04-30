'use client';

import Link from 'next/link';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { login, register, submitLead, type AuthResponse } from '@/lib/api';

/**
 * Auth form — shared markup for /login and /signup. The mode controls:
 *   • Which fields render (signup adds Name + Company)
 *   • Which lib helper is called (login() vs register())
 *   • Heading + alternate-link copy
 *
 * Client component because we manage form state, errors, and the
 * post-submit redirect to /admin (where the backend takes over the
 * authenticated experience).
 */
type Mode = 'login' | 'signup';
type FormState = 'idle' | 'submitting' | 'error';

interface Props {
    mode: Mode;
}

const COPY: Record<Mode, { title: string; subtitle: string; submit: string; alt: string; altHref: string; altText: string }> = {
    login: {
        title: 'Welcome back.',
        subtitle: 'Sign in to your Mero CMS workspace.',
        submit: 'Sign in',
        alt: 'Don’t have an account?',
        altHref: '/signup',
        altText: 'Start free',
    },
    signup: {
        title: 'Start with Mero CMS.',
        subtitle: 'Spin up a free workspace in 90 seconds. No card, no email wall.',
        submit: 'Create workspace',
        alt: 'Already have one?',
        altHref: '/login',
        altText: 'Sign in',
    },
};

export default function AuthForm({ mode }: Props) {
    const [state, setState] = useState<FormState>('idle');
    const [errorMsg, setErrorMsg] = useState<string>('');
    const copy = COPY[mode];

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
        setState('submitting');
        setErrorMsg('');

        try {
            if (mode === 'login') {
                const res: AuthResponse = await login({
                    email: data.email,
                    password: data.password,
                    rememberMe: Boolean(data.rememberMe),
                });
                // Backend returns JWTs; persist for the admin session.
                if (typeof window !== 'undefined') {
                    localStorage.setItem('mero_access_token', res.access_token);
                    localStorage.setItem('mero_refresh_token', res.refresh_token);
                }
                // Send to the admin (frontend on :3000 in dev; whatever the
                // env-configured admin URL is in prod).
                window.location.href = '/admin';
            } else {
                const res = await register({
                    email: data.email,
                    password: data.password,
                    name: data.name,
                });
                if (!res.success) throw new Error(res.error || 'Could not create workspace.');

                // Capture every demo signup as a lead so sales can follow up
                // with trial accounts. This is the marketing-theme side of
                // lead capture — the CMS itself uses /public/leads via
                // <ContactForm /> on customers' sites. Failure here is
                // non-blocking: workspace creation already succeeded.
                submitLead({
                    name: data.name || data.email,
                    email: data.email,
                    message: data.company
                        ? `Demo signup from ${data.company}`
                        : 'Demo signup — no company provided',
                    source: 'demo-signup',
                }).catch(err => {
                    console.warn('[AuthForm] Lead capture failed (non-fatal):', err?.message);
                });

                // After signup, log them in to set tokens, then send to admin.
                const auth = await login({ email: data.email, password: data.password });
                if (typeof window !== 'undefined') {
                    localStorage.setItem('mero_access_token', auth.access_token);
                    localStorage.setItem('mero_refresh_token', auth.refresh_token);
                }
                window.location.href = '/admin';
            }
        } catch (err) {
            setState('error');
            setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
        }
    };

    return (
        <div
            style={{
                background: '#fff',
                border: '1px solid var(--paper-3)',
                borderRadius: 'var(--r-md)',
                padding: 32,
                maxWidth: 440,
                width: '100%',
            }}
        >
            <h1 className="display" style={{ fontSize: 30, marginBottom: 6 }}>
                {copy.title}
            </h1>
            <p style={{ color: 'var(--ink-3)', fontSize: 15, marginBottom: 24 }}>{copy.subtitle}</p>

            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {mode === 'signup' && (
                    <>
                        <Field label="Your name" name="name" required type="text" />
                        <Field label="Company (optional)" name="company" type="text" />
                    </>
                )}
                <Field label="Work email" name="email" required type="email" />
                <Field label="Password" name="password" required type="password" />

                {state === 'error' && (
                    <div
                        style={{
                            color: 'var(--brand-deep)',
                            fontSize: 13,
                            background: 'rgba(203,23,43,0.06)',
                            border: '1px solid rgba(203,23,43,0.18)',
                            padding: '8px 10px',
                            borderRadius: 8,
                        }}
                    >
                        {errorMsg}
                    </div>
                )}

                <Button type="submit" variant="brand" size="lg" className="w-full" style={{ width: '100%', marginTop: 4 }}>
                    {state === 'submitting' ? 'Working…' : copy.submit}
                </Button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--ink-3)', marginTop: 20 }}>
                {copy.alt}{' '}
                <Link href={copy.altHref} style={{ color: 'var(--brand)', fontWeight: 600 }}>
                    {copy.altText} →
                </Link>
            </p>
        </div>
    );
}

function Field({
    label,
    name,
    type,
    required,
}: {
    label: string;
    name: string;
    type: 'text' | 'email' | 'password';
    required?: boolean;
}) {
    return (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>{label}</span>
            <input
                type={type}
                name={name}
                required={required}
                style={{
                    width: '100%',
                    padding: '11px 14px',
                    fontSize: 15,
                    fontFamily: 'inherit',
                    color: 'var(--ink)',
                    background: '#fff',
                    border: '1px solid var(--paper-3)',
                    borderRadius: 12,
                    outline: 'none',
                }}
            />
        </label>
    );
}
