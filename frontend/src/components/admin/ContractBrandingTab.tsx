'use client';

import React, { useMemo } from 'react';
import { Globe, SlidersHorizontal, Image as ImageIcon, Palette, Type, LayoutDashboard, Database, ArrowUpRight, Pencil } from 'lucide-react';
import MediaPickerModal from '@/components/ui/MediaPickerModal';
import { apiRequest } from '@/lib/api';

/**
 * Contract-driven Branding tab. Replaces the previous 520-line hand-rolled
 * Identity / Design System / Tokens triptych with a renderer that consumes
 * `/themes/active/branding-fields` and renders each field by `type`.
 *
 * Why this matters
 *   • The active theme's `theme.json` declares which branding keys it
 *     respects (groups: Identity / Colors / Typography / Layout). Themes
 *     that don't declare anything fall through to the 16-key default in
 *     `themes.service.ts#getBrandingFields()`.
 *   • The settings live in the `Setting` KV store as before; nothing
 *     about persistence changes.
 *   • Field visibility now matches the active theme. Swapping themes
 *     hides the controls the new theme doesn't use, instead of letting
 *     users edit fields with no visible effect.
 *   • Each color/font/token field maps to a CSS custom property via the
 *     contract's `cssVar`, which the marketing theme injects at runtime
 *     in `app/layout.tsx`. So a save here propagates to every page on
 *     the next request — no rebuild.
 */

interface BrandingField {
    key: string;
    label: string;
    type: 'string' | 'text' | 'color' | 'media' | 'font' | 'size' | 'weight' | 'select';
    fallback?: string | null;
    cssVar?: string;
    options?: string[];
}

interface BrandingGroup {
    group: string;
    fields: BrandingField[];
}

interface Props {
    settings: Record<string, any>;
    setSettings: React.Dispatch<React.SetStateAction<any>>;
    contract: BrandingGroup[];
    activeThemeName: string | null;
    usage: any;
    /** Optional API endpoint override. Defaults to '/settings'. The admin
        dashboard branding tab passes '/settings/admin-branding' here so its
        save goes through the tier-gated endpoint instead. */
    saveEndpoint?: string;
    /** Optional banner subtitle override — replaces the default
        "respects N branding fields" copy. Useful when the contract is
        not theme-driven (e.g. admin dashboard branding). */
    bannerTitle?: string;
    bannerSubtitle?: string;
    /** Optional right-rail override. When omitted, the default Live
        Preview + Browse Themes cards render. */
    rightRail?: React.ReactNode;
}

const GROUP_ICON: Record<string, React.ComponentType<any>> = {
    Identity:   Globe,
    Colors:     Palette,
    Typography: Type,
    Layout:     LayoutDashboard,
};

export default function ContractBrandingTab({
    settings,
    setSettings,
    contract,
    activeThemeName,
    usage,
    saveEndpoint = '/settings',
    bannerTitle,
    bannerSubtitle,
    rightRail,
}: Props) {
    const [editing, setEditing] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [mediaPickerKey, setMediaPickerKey] = React.useState<string | null>(null);
    const [toast, setToast] = React.useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

    // Auto-enter edit mode when every contract field is empty (first-run UX).
    const allEmpty = useMemo(
        () => contract.every(g => g.fields.every(f => !settings[f.key])),
        [contract, settings],
    );
    const isEditing = editing || allEmpty;

    const totalFields = contract.reduce((s, g) => s + g.fields.length, 0);

    const updateField = (key: string, value: any) => {
        setSettings((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Only send the keys this contract declares — keeps the payload
            // tight and lets tier-gated endpoints (like /settings/admin-branding)
            // accept it without filtering server-side.
            const declared = new Set<string>();
            contract.forEach(g => g.fields.forEach(f => declared.add(f.key)));
            const body: Record<string, any> = {};
            for (const key of declared) {
                if (settings[key] !== undefined) body[key] = settings[key];
            }
            await apiRequest(saveEndpoint, { method: 'PATCH', body });
            setToast({ kind: 'ok', msg: 'Branding saved. The live site will update on the next request.' });
            setEditing(false);
        } catch (err: any) {
            setToast({ kind: 'err', msg: err?.message || 'Could not save branding.' });
        } finally {
            setSaving(false);
            setTimeout(() => setToast(null), 4000);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {/* Active-theme contract banner. */}
                <div className="rounded-2xl border border-indigo-200/60 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5 p-5">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-600 rounded-xl text-white shrink-0">
                            <SlidersHorizontal className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-300 uppercase tracking-widest">
                                {bannerTitle || 'Active theme contract'}
                            </p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                                {bannerSubtitle ||
                                    `${activeThemeName || 'Active theme'} respects ${totalFields} branding fields across ${contract.length} groups.`}
                            </p>
                            {!bannerSubtitle && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                                    Changes propagate to the live site as CSS variables — no code redeploy. Switching themes will adjust which controls appear here.
                                </p>
                            )}
                        </div>
                        {!isEditing && (
                            <button
                                onClick={() => setEditing(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 hover:border-indigo-400 transition-colors"
                            >
                                <Pencil className="h-3 w-3" />
                                Edit
                            </button>
                        )}
                    </div>
                </div>

                {/* Group cards — one per contract group. */}
                {contract.map(group => {
                    const Icon = GROUP_ICON[group.group] || SlidersHorizontal;
                    return (
                        <section
                            key={group.group}
                            className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-white/[0.06] space-y-6 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />

                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-500/20 text-white">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">{group.group}</h3>
                                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                                        {group.fields.length} field{group.fields.length === 1 ? '' : 's'} · declared by {activeThemeName || 'active theme'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                                {group.fields.map(field => (
                                    <FieldRenderer
                                        key={field.key}
                                        field={field}
                                        value={settings[field.key]}
                                        onChange={(v) => updateField(field.key, v)}
                                        isEditing={isEditing}
                                        onPickMedia={() => setMediaPickerKey(field.key)}
                                    />
                                ))}
                            </div>
                        </section>
                    );
                })}

                {/* Save / cancel. */}
                {isEditing && (
                    <div className="flex flex-wrap gap-3 pt-2">
                        <button
                            disabled={saving}
                            onClick={handleSave}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving…' : 'Save branding'}
                        </button>
                        {!allEmpty && (
                            <button
                                onClick={() => setEditing(false)}
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-widest hover:border-slate-300 transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                )}

                {toast && (
                    <div
                        className={`rounded-2xl border p-4 text-sm font-medium ${
                            toast.kind === 'ok'
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300'
                        }`}
                    >
                        {toast.msg}
                    </div>
                )}
            </div>

            {/* Right rail. Caller can override via the rightRail prop —
                used by the admin dashboard branding tab to show different
                helper cards (e.g. "Live preview the dashboard" instead of
                "browse themes"). */}
            <div className="space-y-6">
                {rightRail ?? (
                    <>
                        <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-8 relative overflow-hidden border border-slate-200 dark:border-white/[0.08] group">
                            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-slate-500/5 rounded-full blur-3xl group-hover:bg-slate-500/10 transition-colors duration-1000 pointer-events-none" />
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="h-16 w-16 bg-slate-200/60 dark:bg-white/[0.08] rounded-xl flex items-center justify-center border border-slate-300/50 dark:border-white/[0.1] mb-8">
                                    <Database className="h-8 w-8 text-slate-600 dark:text-slate-300" />
                                </div>
                                <h3 className="text-2xl font-bold font-display uppercase tracking-tight text-slate-900 dark:text-white">Live preview</h3>
                                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-[0.2em] max-w-[200px] leading-relaxed">
                                    Your changes flow to the live theme via CSS variables. Save to publish.
                                </p>
                                {usage && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-6">
                                        Plan:{' '}
                                        <span className="font-bold text-slate-900 dark:text-white">
                                            {usage?.activePackage?.name || 'Basic'}
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="bg-blue-50/50 dark:bg-blue-500/[0.07] rounded-2xl p-8 relative overflow-hidden border border-blue-100 dark:border-blue-500/20 group">
                            <h4 className="text-[10px] font-medium text-blue-500 dark:text-blue-400 uppercase tracking-[0.2em] mb-3">Theme contract</h4>
                            <h3 className="text-xl font-bold font-display leading-tight uppercase text-slate-900 dark:text-white">Want more controls?</h3>
                            <p className="text-[10px] font-medium text-blue-600 dark:text-blue-300 mt-4 leading-relaxed uppercase tracking-widest">
                                Switch themes or extend your theme&apos;s `brandingFields` block in `theme.json` to declare new keys.
                            </p>
                            <a
                                href="/dashboard/themes"
                                className="inline-flex items-center gap-1.5 mt-8 w-fit px-5 py-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-widest hover:border-blue-400 transition-colors"
                            >
                                Browse themes <ArrowUpRight className="h-3 w-3" />
                            </a>
                        </div>
                    </>
                )}
            </div>

            {/* Media picker — used by `media`-type fields. */}
            {mediaPickerKey && (
                <MediaPickerModal
                    isOpen={true}
                    onClose={() => setMediaPickerKey(null)}
                    onSelect={(url: string) => {
                        updateField(mediaPickerKey, url);
                        setMediaPickerKey(null);
                    }}
                />
            )}
        </div>
    );
}

/**
 * Renders one field by its declared `type`. Read-only mode dims the input
 * and disables interaction; the read view still shows the current value
 * so users can inspect what's set without flipping into edit mode.
 */
function FieldRenderer({
    field,
    value,
    onChange,
    isEditing,
    onPickMedia,
}: {
    field: BrandingField;
    value: any;
    onChange: (v: any) => void;
    isEditing: boolean;
    onPickMedia: () => void;
}) {
    const display = value ?? field.fallback ?? '';

    const labelEl = (
        <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">
                {field.label}
            </span>
            {field.cssVar && (
                <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500">
                    {field.cssVar}
                </span>
            )}
        </div>
    );

    const baseInputClass =
        'w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm text-slate-950 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed';

    // Color picker: swatch + hex input.
    if (field.type === 'color') {
        const hex = (value || field.fallback || '#000000') as string;
        return (
            <label className="block">
                {labelEl}
                <div className="flex items-center gap-3">
                    <input
                        type="color"
                        value={hex}
                        disabled={!isEditing}
                        onChange={e => onChange(e.target.value)}
                        className="h-12 w-16 rounded-xl border border-slate-200 dark:border-white/10 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <input
                        type="text"
                        value={value ?? ''}
                        placeholder={field.fallback || ''}
                        disabled={!isEditing}
                        onChange={e => onChange(e.target.value)}
                        className={`${baseInputClass} font-mono`}
                    />
                </div>
            </label>
        );
    }

    // Media picker (logo, favicon).
    if (field.type === 'media') {
        return (
            <label className="block">
                {labelEl}
                <button
                    type="button"
                    onClick={isEditing ? onPickMedia : undefined}
                    disabled={!isEditing}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border border-dashed text-left transition-colors ${
                        isEditing
                            ? 'border-slate-300 dark:border-white/15 hover:border-indigo-400 cursor-pointer bg-slate-50 dark:bg-slate-950'
                            : 'border-slate-200 dark:border-white/10 bg-slate-50/40 dark:bg-slate-950/40 cursor-not-allowed opacity-60'
                    }`}
                >
                    <div className="h-12 w-12 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                        {value ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={value} alt={field.label} className="h-full w-full object-contain" />
                        ) : (
                            <ImageIcon className="h-5 w-5 text-slate-400" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                            {value ? value.split('/').pop() : 'No file selected'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                            {isEditing ? 'Click to change' : 'Read-only — click Edit to change'}
                        </div>
                    </div>
                </button>
            </label>
        );
    }

    // Select-style fields (font, size, weight, layout density).
    if ((field.type === 'font' || field.type === 'size' || field.type === 'weight' || field.type === 'select') && field.options?.length) {
        return (
            <label className="block">
                {labelEl}
                <select
                    value={display}
                    disabled={!isEditing}
                    onChange={e => onChange(e.target.value)}
                    className={baseInputClass}
                    style={field.type === 'font' ? { fontFamily: display ? `'${display}', system-ui` : undefined } : undefined}
                >
                    {!field.options.includes(display) && display && (
                        <option value={display}>{display} (custom)</option>
                    )}
                    {field.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            </label>
        );
    }

    // Multi-line text.
    if (field.type === 'text') {
        return (
            <label className="block md:col-span-2">
                {labelEl}
                <textarea
                    value={value ?? ''}
                    placeholder={field.fallback || ''}
                    disabled={!isEditing}
                    rows={2}
                    onChange={e => onChange(e.target.value)}
                    className={`${baseInputClass} resize-y min-h-[60px]`}
                />
            </label>
        );
    }

    // Default: single-line string.
    return (
        <label className="block">
            {labelEl}
            <input
                type="text"
                value={value ?? ''}
                placeholder={field.fallback || ''}
                disabled={!isEditing}
                onChange={e => onChange(e.target.value)}
                className={baseInputClass}
            />
        </label>
    );
}
