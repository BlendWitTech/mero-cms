'use client';

import { useEffect, useState } from 'react';
import { Fingerprint, Plus, Trash2, Copy, Check, ShieldAlert, Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { useCapabilities } from '@/context/CapabilitiesContext';
import { useNotification } from '@/context/NotificationContext';
import PageHeader from '@/components/ui/PageHeader';

interface ApiKeyRow {
    id: string;
    name: string;
    prefix: string;
    scopes: string[];
    lastUsedAt: string | null;
    expiresAt: string | null;
    revokedAt: string | null;
    createdAt: string;
}

interface CreatedApiKey extends ApiKeyRow {
    token: string;
}

const AVAILABLE_SCOPES = [
    { key: 'pages:read', label: 'Read pages' },
    { key: 'pages:write', label: 'Write pages' },
    { key: 'posts:read', label: 'Read posts' },
    { key: 'posts:write', label: 'Write posts' },
    { key: 'forms:read', label: 'Read form submissions' },
    { key: 'collections:read', label: 'Read collections' },
    { key: 'collections:write', label: 'Write collections' },
    { key: 'media:read', label: 'Read media' },
] as const;

function formatDate(d: string | null): string {
    if (!d) return 'Never';
    return new Date(d).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

export default function ApiKeysPage() {
    const { limits, activePackage, isLoading: capsLoading } = useCapabilities();
    const { showToast } = useNotification();
    const [keys, setKeys] = useState<ApiKeyRow[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Create-modal state
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newScopes, setNewScopes] = useState<string[]>([]);
    const [newExpiresAt, setNewExpiresAt] = useState('');
    const [creating, setCreating] = useState(false);

    // Show-once reveal state
    const [justCreated, setJustCreated] = useState<CreatedApiKey | null>(null);
    const [copied, setCopied] = useState(false);

    // Revoke confirmation
    const [revokeTarget, setRevokeTarget] = useState<ApiKeyRow | null>(null);
    const [revoking, setRevoking] = useState(false);

    const canUseFeature = limits?.hasApiAccess === true;

    const load = async () => {
        try {
            const rows = await apiRequest('/api-keys', { skipNotification: true });
            setKeys(Array.isArray(rows) ? rows : []);
            setError(null);
        } catch (err: any) {
            setError(err?.message || 'Failed to load API keys');
            setKeys([]);
        }
    };

    useEffect(() => {
        if (!capsLoading && canUseFeature) load();
        else if (!capsLoading) setKeys([]);
    }, [capsLoading, canUseFeature]);

    const toggleScope = (key: string) => {
        setNewScopes(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));
    };

    const handleCreate = async () => {
        if (!newName.trim()) {
            showToast('Give the key a name first.', 'error');
            return;
        }
        setCreating(true);
        try {
            const result = await apiRequest('/api-keys', {
                method: 'POST',
                body: {
                    name: newName.trim(),
                    scopes: newScopes,
                    expiresAt: newExpiresAt || null,
                },
            });
            setJustCreated(result);
            setShowCreate(false);
            setNewName('');
            setNewScopes([]);
            setNewExpiresAt('');
            await load();
        } catch (err: any) {
            showToast(err?.message || 'Failed to create key', 'error');
        } finally {
            setCreating(false);
        }
    };

    const handleCopy = async () => {
        if (!justCreated) return;
        try {
            await navigator.clipboard.writeText(justCreated.token);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            showToast('Copy failed — select and copy manually.', 'error');
        }
    };

    const handleRevoke = async () => {
        if (!revokeTarget) return;
        setRevoking(true);
        try {
            await apiRequest(`/api-keys/${revokeTarget.id}`, { method: 'DELETE' });
            showToast('Key revoked.', 'success');
            setRevokeTarget(null);
            await load();
        } catch (err: any) {
            showToast(err?.message || 'Failed to revoke key', 'error');
        } finally {
            setRevoking(false);
        }
    };

    // ─── Upsell state ─────────────────────────────────────────────────────────
    if (!capsLoading && !canUseFeature) {
        return (
            <div className="space-y-6">
                <PageHeader title="API" accent="Keys" subtitle="Build against your CMS with programmatic access." />
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-white/[0.06]">
                    <div className="flex items-start gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 grid place-items-center shrink-0">
                            <Lock className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">
                                    Professional / Enterprise feature
                                </span>
                            </div>
                            <h3 className="mt-2 text-xl font-black text-slate-900 dark:text-white">
                                Direct API access
                            </h3>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                                Generate scoped tokens to pull pages, posts, forms, and collections from outside the
                                admin. Available on Personal Professional, Personal Custom, Org Enterprise, and Org
                                Custom plans.
                            </p>
                            <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">
                                Not available on {activePackage?.name ?? 'your current'} plan.
                            </p>
                            <div className="mt-5">
                                <Link
                                    href="/dashboard/settings?tab=billing"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition"
                                >
                                    View plans →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Main page ────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            <PageHeader
                title="API"
                accent="Keys"
                subtitle="Generate scoped tokens to access Mero CMS from your own apps and scripts."
                actions={
                    <button
                        onClick={() => setShowCreate(true)}
                        className="btn-primary px-4 py-2.5 text-sm gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        New API Key
                    </button>
                }
            />

            {error && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 p-4 text-sm text-red-700 dark:text-red-300">
                    {error}
                </div>
            )}

            {keys && keys.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-10 text-center">
                    <Fingerprint className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <h3 className="text-base font-black text-slate-900 dark:text-white">No API keys yet</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Click &ldquo;New API Key&rdquo; to mint one. You can scope it to specific resources
                        and revoke it any time.
                    </p>
                </div>
            )}

            {keys && keys.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/[0.06] overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <tr>
                                <th className="text-left px-5 py-3">Name</th>
                                <th className="text-left px-5 py-3">Prefix</th>
                                <th className="text-left px-5 py-3">Scopes</th>
                                <th className="text-left px-5 py-3">Last used</th>
                                <th className="text-left px-5 py-3">Created</th>
                                <th className="text-left px-5 py-3">Status</th>
                                <th className="text-right px-5 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {keys.map(k => {
                                const isRevoked = !!k.revokedAt;
                                const isExpired = k.expiresAt && new Date(k.expiresAt).getTime() < Date.now();
                                return (
                                    <tr
                                        key={k.id}
                                        className="border-t border-slate-100 dark:border-white/[0.04]"
                                    >
                                        <td className="px-5 py-3 font-bold text-slate-900 dark:text-white">{k.name}</td>
                                        <td className="px-5 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                                            {k.prefix}…
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {k.scopes.length === 0 ? (
                                                    <span className="text-xs text-slate-400 italic">full access</span>
                                                ) : (
                                                    k.scopes.map(s => (
                                                        <span
                                                            key={s}
                                                            className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded"
                                                        >
                                                            {s}
                                                        </span>
                                                    ))
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-slate-500 dark:text-slate-400 text-xs">
                                            {formatDate(k.lastUsedAt)}
                                        </td>
                                        <td className="px-5 py-3 text-slate-500 dark:text-slate-400 text-xs">
                                            {formatDate(k.createdAt)}
                                        </td>
                                        <td className="px-5 py-3">
                                            {isRevoked ? (
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 uppercase tracking-wider">
                                                    Revoked
                                                </span>
                                            ) : isExpired ? (
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                                                    Expired
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                                                    Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            {!isRevoked && (
                                                <button
                                                    onClick={() => setRevokeTarget(k)}
                                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                                    title="Revoke key"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ─── Create Modal ─── */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-slate-200 dark:ring-white/10 animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-100 dark:border-white/[0.06]">
                            <h2 className="text-base font-black text-slate-900 dark:text-white">Create API Key</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="Production ingest key"
                                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/[0.07] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                />
                                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                    A memorable label so you know what this key is used for.
                                </p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                                    Scopes
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {AVAILABLE_SCOPES.map(s => {
                                        const active = newScopes.includes(s.key);
                                        return (
                                            <button
                                                key={s.key}
                                                type="button"
                                                onClick={() => toggleScope(s.key)}
                                                className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-all ${active
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-blue-300'
                                                    }`}
                                                title={s.label}
                                            >
                                                {s.key}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                    Leave empty for full access (all endpoints the owning user can reach).
                                </p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                                    Expires at (optional)
                                </label>
                                <input
                                    type="datetime-local"
                                    value={newExpiresAt}
                                    onChange={e => setNewExpiresAt(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/[0.07] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
                            <button
                                onClick={() => setShowCreate(false)}
                                className="btn-outline px-5 py-2 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={creating}
                                className="btn-primary px-5 py-2 text-sm"
                            >
                                {creating ? 'Creating…' : 'Create key'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Show-once Modal ─── */}
            {justCreated && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden ring-1 ring-slate-200 dark:ring-white/10 animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-100 dark:border-white/[0.06]">
                            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-amber-500" />
                                Copy your key — this is the only time you&rsquo;ll see it
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 p-4 text-xs text-amber-800 dark:text-amber-300">
                                We don&rsquo;t store the raw token — only a hash. If you lose it, revoke this key and
                                create a new one.
                            </div>
                            <div className="relative">
                                <pre className="text-xs font-mono bg-slate-900 dark:bg-slate-950 text-emerald-300 rounded-xl p-4 break-all whitespace-pre-wrap border border-slate-800">
                                    {justCreated.token}
                                </pre>
                                <button
                                    onClick={handleCopy}
                                    className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                                    title="Copy to clipboard"
                                >
                                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                                <p className="font-bold text-slate-700 dark:text-slate-300">Use it like this:</p>
                                <pre className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-lg p-3 text-[11px] font-mono text-slate-600 dark:text-slate-300 overflow-x-auto">
{`curl -H "Authorization: Bearer ${justCreated.token.slice(0, 16)}…" \\
  ${typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':3001') : ''}/pages`}
                                </pre>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-slate-900 flex justify-end">
                            <button
                                onClick={() => setJustCreated(null)}
                                className="btn-primary px-5 py-2 text-sm"
                            >
                                I&rsquo;ve saved it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Revoke confirmation ─── */}
            {revokeTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden ring-1 ring-slate-200 dark:ring-white/10 animate-in zoom-in-95">
                        <div className="p-6 space-y-3">
                            <h2 className="text-base font-black text-slate-900 dark:text-white">Revoke key?</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                <strong>{revokeTarget.name}</strong> will stop working immediately.
                                This cannot be undone.
                            </p>
                        </div>
                        <div className="p-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
                            <button
                                onClick={() => setRevokeTarget(null)}
                                className="btn-outline px-4 py-2 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRevoke}
                                disabled={revoking}
                                className="btn-destructive px-4 py-2 text-sm"
                            >
                                {revoking ? 'Revoking…' : 'Revoke key'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
