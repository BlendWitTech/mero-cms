'use client';

import { useState, useEffect } from 'react';
import { CheckCircleIcon, GlobeAltIcon, EnvelopeIcon, CircleStackIcon } from '@heroicons/react/24/outline';

/**
 * One-step bundle of optional setup sections — site URL, email, and
 * storage. Each section can be skipped; the user always reaches the
 * "Continue" button at the bottom and lands on the License & Modules
 * step regardless of which sections they filled in.
 *
 * Why all three on one step?
 *   The setup wizard is already 4–5 steps long. Splitting these into
 *   three more would push the wizard past 8 steps, which feels
 *   bureaucratic. Bundling them into a single "Site Configuration"
 *   step keeps the perceived work short while still letting customers
 *   configure everything they need without ever opening .env.
 *
 * Skip semantics:
 *   - Site URL has a sensible auto-derived default (request origin),
 *     pre-filled. Leaving it untouched still saves the value.
 *   - Email is genuinely optional — without it password resets / email
 *     verification won't go out, but that's a recoverable gap. We
 *     surface a small warning under the section so customers know.
 *   - Storage defaults to 'local' (filesystem). Self-hosters running
 *     on a single box never need to touch this.
 */

type Provider = 'smtp' | 'resend';
type StorageProvider = 'local' | 's3' | 'cloudinary';

interface TestResult {
    success: boolean;
    error?: string;
}

export interface IntegrationsStepProps {
    apiUrl: string;
    onContinue: () => void;
    onBack: () => void;
    /** Optional toast hook so we share the parent's notification UI. */
    showToast?: (message: string, kind: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function IntegrationsStep({ apiUrl, onContinue, onBack, showToast }: IntegrationsStepProps) {
    // Site URL — pre-fill with the request origin so single-machine
    // self-hosters can just hit Continue.
    const [siteUrl, setSiteUrl] = useState('');
    const [mediaHost, setMediaHost] = useState('');

    // Email
    const [emailProvider, setEmailProvider] = useState<Provider>('smtp');
    const [smtpHost, setSmtpHost] = useState('');
    const [smtpPort, setSmtpPort] = useState<number>(587);
    const [smtpUser, setSmtpUser] = useState('');
    const [smtpPass, setSmtpPass] = useState('');
    const [smtpFrom, setSmtpFrom] = useState('');
    const [smtpSecure, setSmtpSecure] = useState(false);
    const [resendApiKey, setResendApiKey] = useState('');
    const [emailTesting, setEmailTesting] = useState(false);
    const [emailResult, setEmailResult] = useState<TestResult | null>(null);

    // Storage
    const [storageProvider, setStorageProvider] = useState<StorageProvider>('local');
    const [s3AccessKey, setS3AccessKey] = useState('');
    const [s3SecretKey, setS3SecretKey] = useState('');
    const [s3Bucket, setS3Bucket] = useState('');
    const [s3Region, setS3Region] = useState('auto');
    const [s3Endpoint, setS3Endpoint] = useState('');
    const [storageTesting, setStorageTesting] = useState(false);
    const [storageResult, setStorageResult] = useState<TestResult | null>(null);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Default the site URL to where the wizard is being served from.
        // For most local installs that's exactly right (http://localhost:3000).
        if (typeof window !== 'undefined' && !siteUrl) {
            setSiteUrl(window.location.origin);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleTestEmail = async () => {
        setError('');
        setEmailResult(null);
        setEmailTesting(true);
        try {
            const res = await fetch(`${apiUrl}/setup/email/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: emailProvider,
                    smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure,
                    resendApiKey,
                }),
            });
            const data = await res.json();
            setEmailResult({ success: !!data.success, error: data.error });
            if (data.success) showToast?.('Email connection verified.', 'success');
            else showToast?.(data.error || 'Could not verify email.', 'error');
        } catch (err: any) {
            setEmailResult({ success: false, error: err?.message || 'Network error' });
        } finally {
            setEmailTesting(false);
        }
    };

    const handleTestStorage = async () => {
        setError('');
        setStorageResult(null);
        setStorageTesting(true);
        try {
            const res = await fetch(`${apiUrl}/setup/storage/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accessKey: s3AccessKey,
                    secretKey: s3SecretKey,
                    bucket: s3Bucket,
                    region: s3Region,
                    endpoint: s3Endpoint,
                }),
            });
            const data = await res.json();
            setStorageResult({ success: !!data.success, error: data.error });
            if (data.success) showToast?.('Bucket reachable.', 'success');
            else showToast?.(data.error || 'Could not reach bucket.', 'error');
        } catch (err: any) {
            setStorageResult({ success: false, error: err?.message || 'Network error' });
        } finally {
            setStorageTesting(false);
        }
    };

    /**
     * Save everything we have, then continue. Empty sections are still
     * persisted (so storage_provider=local sticks even if the user
     * never touched the section). Network errors abort the continue
     * so we don't pretend a failed save succeeded.
     */
    const handleContinue = async () => {
        setError('');
        setSaving(true);
        try {
            // Site URL — always saved.
            if (siteUrl.trim()) {
                const r = await fetch(`${apiUrl}/setup/site-url/save`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ siteUrl, mediaHost }),
                });
                if (!r.ok) {
                    const e = await r.json().catch(() => ({}));
                    throw new Error(e.message || 'Failed to save site URL');
                }
            }

            // Email — only saved if the customer typed credentials. We
            // still save the provider choice so the dashboard can pick
            // up where they left off.
            const emailHasInput = !!(smtpHost || smtpUser || resendApiKey);
            if (emailHasInput) {
                const r = await fetch(`${apiUrl}/setup/email/save`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        provider: emailProvider,
                        smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure, smtpFrom,
                        resendApiKey,
                    }),
                });
                if (!r.ok) {
                    const e = await r.json().catch(() => ({}));
                    throw new Error(e.message || 'Failed to save email config');
                }
            }

            // Storage — provider always saved (defaults to 'local').
            const storagePayload: Record<string, unknown> = { provider: storageProvider };
            if (storageProvider === 's3') {
                Object.assign(storagePayload, {
                    accessKey: s3AccessKey,
                    secretKey: s3SecretKey,
                    bucket: s3Bucket,
                    region: s3Region,
                    endpoint: s3Endpoint,
                });
            }
            const sr = await fetch(`${apiUrl}/setup/storage/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(storagePayload),
            });
            if (!sr.ok) {
                const e = await sr.json().catch(() => ({}));
                throw new Error(e.message || 'Failed to save storage config');
            }

            onContinue();
        } catch (err: any) {
            setError(err?.message || 'Could not save site configuration');
        } finally {
            setSaving(false);
        }
    };

    const sectionTitleClass = 'flex items-center gap-2 text-sm font-black text-slate-900';
    const inputClass = 'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium';
    const fieldLabelClass = 'text-[11px] font-black text-slate-700 uppercase tracking-widest mb-1.5 block';

    return (
        <div className="space-y-8">
            <div className="mb-2">
                <h2 className="text-2xl font-black text-slate-900 mb-1">Site Configuration</h2>
                <p className="text-sm text-slate-500 font-medium">
                    URL, email, and storage. Everything here can be changed later from Settings — fill in what you have, skip the rest.
                </p>
            </div>

            {/* ── Site URL ─────────────────────────────────────── */}
            <section className="space-y-3 pb-7 border-b border-slate-100">
                <h3 className={sectionTitleClass}>
                    <GlobeAltIcon className="h-4 w-4 text-blue-500" />
                    Site URL
                </h3>
                <p className="text-xs text-slate-500">
                    The public URL where your site is reachable. Used for email links, sitemaps, and canonical tags. We've prefilled it from where you opened the wizard.
                </p>
                <div className="grid grid-cols-1 gap-3">
                    <label className="block">
                        <span className={fieldLabelClass}>Site URL</span>
                        <input
                            type="url"
                            value={siteUrl}
                            onChange={(e) => setSiteUrl(e.target.value)}
                            placeholder="https://example.com"
                            className={inputClass}
                        />
                    </label>
                    <label className="block">
                        <span className={fieldLabelClass}>
                            Media host <span className="normal-case font-normal text-slate-400">(optional — only for split CDN setups)</span>
                        </span>
                        <input
                            type="url"
                            value={mediaHost}
                            onChange={(e) => setMediaHost(e.target.value)}
                            placeholder="Leave empty to derive from Site URL"
                            className={inputClass}
                        />
                    </label>
                </div>
            </section>

            {/* ── Email ────────────────────────────────────────── */}
            <section className="space-y-3 pb-7 border-b border-slate-100">
                <h3 className={sectionTitleClass}>
                    <EnvelopeIcon className="h-4 w-4 text-blue-500" />
                    Email Service <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Optional</span>
                </h3>
                <p className="text-xs text-slate-500">
                    Used for password resets, invitations, and form submissions. Skip if you don't need transactional emails — you can configure this later in Settings → Email Services.
                </p>

                <div className="flex gap-2 mb-2">
                    {(['smtp', 'resend'] as Provider[]).map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => { setEmailProvider(p); setEmailResult(null); }}
                            className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-lg border transition-all ${
                                emailProvider === p
                                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                        >
                            {p === 'smtp' ? 'SMTP' : 'Resend'}
                        </button>
                    ))}
                </div>

                {emailProvider === 'smtp' && (
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block col-span-2">
                            <span className={fieldLabelClass}>Host</span>
                            <input type="text" value={smtpHost} onChange={(e) => { setSmtpHost(e.target.value); setEmailResult(null); }} placeholder="smtp.gmail.com" className={inputClass} />
                        </label>
                        <label className="block">
                            <span className={fieldLabelClass}>Port</span>
                            <input type="number" value={smtpPort} onChange={(e) => { setSmtpPort(Number(e.target.value) || 587); setEmailResult(null); }} placeholder="587" className={inputClass} />
                        </label>
                        <label className="block">
                            <span className={fieldLabelClass}>Username</span>
                            <input type="text" value={smtpUser} onChange={(e) => { setSmtpUser(e.target.value); setEmailResult(null); }} placeholder="you@example.com" className={inputClass} />
                        </label>
                        <label className="block col-span-2">
                            <span className={fieldLabelClass}>Password / App Password</span>
                            <input type="password" value={smtpPass} onChange={(e) => { setSmtpPass(e.target.value); setEmailResult(null); }} placeholder="••••••••" className={inputClass} />
                        </label>
                        <label className="block col-span-2">
                            <span className={fieldLabelClass}>From email <span className="normal-case font-normal text-slate-400">(defaults to username)</span></span>
                            <input type="email" value={smtpFrom} onChange={(e) => setSmtpFrom(e.target.value)} placeholder="noreply@example.com" className={inputClass} />
                        </label>
                        <label className="col-span-2 flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                            <input type="checkbox" checked={smtpSecure} onChange={(e) => { setSmtpSecure(e.target.checked); setEmailResult(null); }} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                            <div>
                                <span className="text-sm font-bold text-slate-900 block">Force TLS</span>
                                <span className="text-xs text-slate-500">Auto-detected from port (465 = on, 587 = STARTTLS).</span>
                            </div>
                        </label>
                    </div>
                )}

                {emailProvider === 'resend' && (
                    <label className="block">
                        <span className={fieldLabelClass}>Resend API Key</span>
                        <input type="password" value={resendApiKey} onChange={(e) => { setResendApiKey(e.target.value); setEmailResult(null); }} placeholder="re_xxxxxxxxxxxxx" className={inputClass} />
                        <span className="block mt-1.5 text-[10px] text-slate-400">Get one at resend.com — free tier supports 100 emails/day.</span>
                    </label>
                )}

                {emailResult && (
                    <div className={`p-3 rounded-xl text-xs font-semibold ${emailResult.success ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                        {emailResult.success ? '✓ Email connection verified.' : `✗ ${emailResult.error}`}
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={emailTesting}
                    className="px-4 py-2 bg-white border-2 border-slate-300 hover:border-blue-500 hover:text-blue-600 text-slate-700 font-bold text-xs rounded-xl transition-all disabled:opacity-50"
                >
                    {emailTesting ? 'Testing…' : 'Test connection'}
                </button>
            </section>

            {/* ── Storage ──────────────────────────────────────── */}
            <section className="space-y-3">
                <h3 className={sectionTitleClass}>
                    <CircleStackIcon className="h-4 w-4 text-blue-500" />
                    Media Storage
                </h3>
                <p className="text-xs text-slate-500">
                    Where uploaded images, videos, and documents are stored. Local disk works for single-machine installs; pick S3 for cloud-scale or multi-server setups.
                </p>

                <div className="grid grid-cols-3 gap-2">
                    {([
                        { v: 'local', label: 'Local disk', desc: 'Recommended' },
                        { v: 's3', label: 'S3 / R2 / Minio', desc: 'Cloud bucket' },
                        { v: 'cloudinary', label: 'Cloudinary', desc: 'Configure later' },
                    ] as { v: StorageProvider; label: string; desc: string }[]).map(({ v, label, desc }) => (
                        <button
                            key={v}
                            type="button"
                            onClick={() => { setStorageProvider(v); setStorageResult(null); }}
                            disabled={v === 'cloudinary'}
                            className={`text-left p-3 rounded-xl border-2 transition-all ${
                                storageProvider === v
                                    ? 'bg-blue-50 border-blue-400'
                                    : v === 'cloudinary'
                                        ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed'
                                        : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <span className={`block text-xs font-bold ${storageProvider === v ? 'text-blue-700' : 'text-slate-700'}`}>{label}</span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">{desc}</span>
                        </button>
                    ))}
                </div>

                {storageProvider === 's3' && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <label className="block col-span-2">
                            <span className={fieldLabelClass}>Endpoint <span className="normal-case font-normal text-slate-400">(blank for AWS S3)</span></span>
                            <input type="url" value={s3Endpoint} onChange={(e) => { setS3Endpoint(e.target.value); setStorageResult(null); }} placeholder="https://<account-id>.r2.cloudflarestorage.com" className={inputClass} />
                        </label>
                        <label className="block col-span-2">
                            <span className={fieldLabelClass}>Bucket</span>
                            <input type="text" value={s3Bucket} onChange={(e) => { setS3Bucket(e.target.value); setStorageResult(null); }} placeholder="mero-uploads" className={inputClass} />
                        </label>
                        <label className="block">
                            <span className={fieldLabelClass}>Region</span>
                            <input type="text" value={s3Region} onChange={(e) => { setS3Region(e.target.value); setStorageResult(null); }} placeholder="auto / us-east-1" className={inputClass} />
                        </label>
                        <label className="block">
                            <span className={fieldLabelClass}>Access key</span>
                            <input type="text" value={s3AccessKey} onChange={(e) => { setS3AccessKey(e.target.value); setStorageResult(null); }} placeholder="AKIA…" className={inputClass} />
                        </label>
                        <label className="block col-span-2">
                            <span className={fieldLabelClass}>Secret key</span>
                            <input type="password" value={s3SecretKey} onChange={(e) => { setS3SecretKey(e.target.value); setStorageResult(null); }} placeholder="••••••••" className={inputClass} />
                        </label>

                        {storageResult && (
                            <div className={`col-span-2 p-3 rounded-xl text-xs font-semibold ${storageResult.success ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                                {storageResult.success ? '✓ Bucket reachable.' : `✗ ${storageResult.error}`}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleTestStorage}
                            disabled={storageTesting}
                            className="col-span-2 px-4 py-2 bg-white border-2 border-slate-300 hover:border-blue-500 hover:text-blue-600 text-slate-700 font-bold text-xs rounded-xl transition-all disabled:opacity-50 w-fit"
                        >
                            {storageTesting ? 'Testing…' : 'Test connection'}
                        </button>
                    </div>
                )}

                {storageProvider === 'local' && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-[11px] font-semibold text-emerald-700">
                        <CheckCircleIcon className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                        Files will be saved to <code className="font-mono px-1 py-0.5 rounded bg-white/60">backend/uploads</code>. No further setup needed.
                    </div>
                )}
            </section>

            {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-red-600">{error}</div>
            )}

            <div className="flex gap-3 pt-2">
                <button
                    onClick={onBack}
                    disabled={saving}
                    className="px-6 py-3.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-xl transition-all disabled:opacity-50"
                >
                    ← Back
                </button>
                <button
                    onClick={handleContinue}
                    disabled={saving}
                    className="flex-1 py-3.5 bg-slate-900 text-white font-bold text-sm rounded-xl shadow-lg shadow-slate-900/20 hover:bg-blue-600 hover:shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-60"
                >
                    {saving ? 'Saving…' : 'Continue →'}
                </button>
            </div>
        </div>
    );
}
