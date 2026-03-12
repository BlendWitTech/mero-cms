'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    DocumentTextIcon,
    ChevronRightIcon,
    EyeIcon,
    EyeSlashIcon,
    PencilSquareIcon,
    CheckIcon,
    XMarkIcon,
    PlusIcon,
    TrashIcon,
    PhotoIcon,
    Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FieldDef {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'richtext' | 'image' | 'number' | 'toggle' | 'button' | 'buttons' | 'url';
    placeholder?: string;
    max?: number;
}

interface SectionDef {
    id: string;
    label: string;
    description?: string;
    fields: FieldDef[];
}

interface PageDef {
    slug: string;
    label: string;
    sections: SectionDef[];
}

interface SectionData {
    enabled: boolean;
    data: Record<string, any>;
}

interface PageSections {
    [sectionId: string]: SectionData;
}

// ─── Field renderer ──────────────────────────────────────────────────────────

function FieldEditor({ field, value, onChange, disabled }: {
    field: FieldDef;
    value: any;
    onChange: (v: any) => void;
    disabled: boolean;
}) {
    const base = 'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all bg-white disabled:opacity-50';

    if (field.type === 'textarea' || field.type === 'richtext') {
        return (
            <textarea
                rows={3}
                disabled={disabled}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={field.placeholder}
                className={base + ' resize-y'}
            />
        );
    }

    if (field.type === 'toggle') {
        return (
            <label className="flex items-center gap-3 cursor-pointer">
                <div className={`relative w-12 h-6 rounded-full transition-colors ${value ? 'bg-red-500' : 'bg-slate-200'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input type="checkbox" className="sr-only" disabled={disabled} checked={!!value} onChange={(e) => onChange(e.target.checked)} />
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-6' : ''}`} />
                </div>
                <span className="text-sm text-slate-600">{value ? 'Enabled' : 'Disabled'}</span>
            </label>
        );
    }

    if (field.type === 'image') {
        return (
            <div className="space-y-2">
                <input
                    type="text"
                    disabled={disabled}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder || 'Paste image URL or path (e.g. /uploads/hero.jpg)'}
                    className={base}
                />
                {value && (
                    <div className="relative h-24 w-32 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                        <img src={value.startsWith('http') ? value : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${value}`} alt="preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                )}
            </div>
        );
    }

    if (field.type === 'button') {
        const btn = value || { text: '', url: '' };
        return (
            <div className="grid grid-cols-2 gap-3">
                <input type="text" disabled={disabled} value={btn.text || ''} onChange={(e) => onChange({ ...btn, text: e.target.value })} placeholder="Button label" className={base} />
                <input type="text" disabled={disabled} value={btn.url || ''} onChange={(e) => onChange({ ...btn, url: e.target.value })} placeholder="/path or URL" className={base} />
            </div>
        );
    }

    if (field.type === 'buttons') {
        const buttons: { text: string; url: string }[] = Array.isArray(value) ? value : [];
        const max = field.max || 3;
        return (
            <div className="space-y-2">
                {buttons.map((btn, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <input type="text" disabled={disabled} value={btn.text || ''} onChange={(e) => { const nb = [...buttons]; nb[i] = { ...nb[i], text: e.target.value }; onChange(nb); }} placeholder="Button label" className={base + ' flex-1'} />
                        <input type="text" disabled={disabled} value={btn.url || ''} onChange={(e) => { const nb = [...buttons]; nb[i] = { ...nb[i], url: e.target.value }; onChange(nb); }} placeholder="/path or URL" className={base + ' flex-1'} />
                        <button disabled={disabled} onClick={() => onChange(buttons.filter((_, j) => j !== i))} className="p-2 text-red-400 hover:text-red-600 disabled:opacity-40">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {buttons.length < max && (
                    <button disabled={disabled} onClick={() => onChange([...buttons, { text: '', url: '' }])} className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-40">
                        <PlusIcon className="w-4 h-4" /> Add Button
                    </button>
                )}
            </div>
        );
    }

    return (
        <input
            type={field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'}
            disabled={disabled}
            value={value || ''}
            onChange={(e) => onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)}
            placeholder={field.placeholder}
            className={base}
        />
    );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ sectionDef, sectionData, onToggle, onDataChange, saving }: {
    sectionDef: SectionDef;
    sectionData: SectionData;
    onToggle: () => void;
    onDataChange: (key: string, value: any) => void;
    saving: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const enabled = sectionData.enabled;
    const hasFields = sectionDef.fields.length > 0;

    return (
        <div className={`border rounded-2xl overflow-hidden transition-all ${enabled ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-white">
                <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${enabled ? 'bg-green-500' : 'bg-slate-300'}`} />
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm">{sectionDef.label}</h4>
                        {sectionDef.description && <p className="text-xs text-slate-400 mt-0.5">{sectionDef.description}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Enable/Disable toggle */}
                    <button
                        onClick={onToggle}
                        disabled={saving}
                        title={enabled ? 'Disable section' : 'Enable section'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${enabled ? 'bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-600' : 'bg-slate-100 text-slate-500 hover:bg-green-50 hover:text-green-600'}`}
                    >
                        {enabled ? <><EyeIcon className="w-3.5 h-3.5" /> Visible</> : <><EyeSlashIcon className="w-3.5 h-3.5" /> Hidden</>}
                    </button>
                    {/* Expand / edit fields */}
                    {hasFields && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                            {expanded ? 'Close' : 'Edit Content'}
                            <ChevronRightIcon className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                        </button>
                    )}
                </div>
            </div>

            {/* Editable fields */}
            {expanded && hasFields && (
                <div className="bg-slate-50 border-t border-slate-100 px-5 py-4 space-y-4">
                    {sectionDef.fields.map((field) => (
                        <div key={field.key}>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{field.label}</label>
                            <FieldEditor
                                field={field}
                                value={sectionData.data?.[field.key]}
                                onChange={(v) => onDataChange(field.key, v)}
                                disabled={saving || !enabled}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SitePagesPage() {
    const { showToast } = useNotification();
    const [pageSchema, setPageSchema] = useState<PageDef[]>([]);
    const [activePage, setActivePage] = useState<string>('');
    const [pagesData, setPagesData] = useState<Record<string, PageSections>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Load schema + current saved data
    const load = useCallback(async () => {
        setIsLoading(true);
        try {
            const [schemaRes, pagesRes] = await Promise.all([
                apiRequest('/themes/active/page-schema'),
                apiRequest('/pages'),
            ]);
            const schema: PageDef[] = schemaRes.pageSchema || [];
            setPageSchema(schema);
            if (schema.length > 0 && !activePage) setActivePage(schema[0].slug);

            // Build initial sections state from saved Page records
            const saved: Record<string, PageSections> = {};
            for (const pageDef of schema) {
                const pageRecord = pagesRes.find((p: any) => p.slug === pageDef.slug);
                const rawSections: any[] = pageRecord?.data?.sections || [];
                const sections: PageSections = {};
                for (const sec of pageDef.sections) {
                    const saved_sec = rawSections.find((s: any) => s.id === sec.id);
                    sections[sec.id] = {
                        enabled: saved_sec ? saved_sec.enabled !== false : true,
                        data: saved_sec?.data || {},
                    };
                }
                saved[pageDef.slug] = sections;
            }
            setPagesData(saved);
        } catch (e: any) {
            showToast(e.message || 'Failed to load page schema', 'error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const currentPageDef = pageSchema.find((p) => p.slug === activePage);
    const currentSections = pagesData[activePage] || {};

    const toggleSection = (sectionId: string) => {
        setPagesData((prev) => ({
            ...prev,
            [activePage]: {
                ...prev[activePage],
                [sectionId]: {
                    ...prev[activePage]?.[sectionId],
                    enabled: !prev[activePage]?.[sectionId]?.enabled,
                },
            },
        }));
    };

    const updateSectionData = (sectionId: string, key: string, value: any) => {
        setPagesData((prev) => ({
            ...prev,
            [activePage]: {
                ...prev[activePage],
                [sectionId]: {
                    ...prev[activePage]?.[sectionId],
                    data: { ...prev[activePage]?.[sectionId]?.data, [key]: value },
                },
            },
        }));
    };

    const save = async () => {
        if (!currentPageDef) return;
        setIsSaving(true);
        try {
            // Build sections array in order
            const sections = currentPageDef.sections.map((sec) => ({
                id: sec.id,
                enabled: currentSections[sec.id]?.enabled ?? true,
                data: currentSections[sec.id]?.data || {},
            }));
            await apiRequest(`/pages/by-slug/${activePage}`, {
                method: 'PUT',
                body: {
                    title: currentPageDef.label,
                    status: 'PUBLISHED',
                    data: { sections },
                },
            });
            showToast(`${currentPageDef.label} sections saved.`, 'success');
        } catch (e: any) {
            showToast(e.message || 'Save failed', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse p-8">
                <div className="h-10 w-48 bg-slate-100 rounded-xl" />
                <div className="flex gap-6">
                    <div className="w-56 space-y-3">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl" />)}
                    </div>
                    <div className="flex-1 space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl" />)}
                    </div>
                </div>
            </div>
        );
    }

    if (pageSchema.length === 0) {
        return (
            <div className="p-8 text-center">
                <Squares2X2Icon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h2 className="font-bold text-slate-600 text-lg">No Page Schema</h2>
                <p className="text-slate-400 text-sm mt-2">The active theme has not defined a <code>pageSchema</code> in its <code>theme.json</code>.</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 px-1">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Site <span className="text-red-600">Pages</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Control which sections appear on each page and customise their content.</p>
                </div>
                <button
                    onClick={save}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all disabled:opacity-50"
                >
                    {isSaving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : <><CheckIcon className="w-4 h-4" /> Save Page</>}
                </button>
            </div>

            <div className="flex gap-6">
                {/* Page sidebar */}
                <div className="w-52 shrink-0 space-y-1.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-3">Pages</p>
                    {pageSchema.map((pageDef) => {
                        const sections = pagesData[pageDef.slug] || {};
                        const enabledCount = Object.values(sections).filter((s) => s.enabled).length;
                        const total = pageDef.sections.length;
                        return (
                            <button
                                key={pageDef.slug}
                                onClick={() => setActivePage(pageDef.slug)}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${activePage === pageDef.slug ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-white border border-slate-100 text-slate-700 hover:border-red-200 hover:text-red-600'}`}
                            >
                                <div>
                                    <div className="text-sm font-bold">{pageDef.label}</div>
                                    <div className={`text-xs mt-0.5 ${activePage === pageDef.slug ? 'text-red-100' : 'text-slate-400'}`}>{enabledCount}/{total} sections</div>
                                </div>
                                <ChevronRightIcon className="w-4 h-4 opacity-40" />
                            </button>
                        );
                    })}
                </div>

                {/* Sections editor */}
                <div className="flex-1 space-y-3">
                    {currentPageDef ? (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="font-bold text-slate-800 text-lg">{currentPageDef.label}</h2>
                                    <p className="text-xs text-slate-400">Toggle sections on/off and edit their content. Save when done.</p>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                    <DocumentTextIcon className="w-4 h-4" />
                                    /{activePage}
                                </div>
                            </div>

                            {currentPageDef.sections.map((sec) => (
                                <SectionCard
                                    key={sec.id}
                                    sectionDef={sec}
                                    sectionData={currentSections[sec.id] || { enabled: true, data: {} }}
                                    onToggle={() => toggleSection(sec.id)}
                                    onDataChange={(key, value) => updateSectionData(sec.id, key, value)}
                                    saving={isSaving}
                                />
                            ))}
                        </>
                    ) : (
                        <div className="text-center py-20 text-slate-400">Select a page to edit its sections.</div>
                    )}
                </div>
            </div>

            {/* Module Aliases info box */}
            <div className="mt-10 bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <h3 className="font-bold text-amber-800 text-sm mb-2">About Content Modules</h3>
                <p className="text-xs text-amber-700 leading-relaxed">
                    This theme uses the <strong>Projects</strong> module to store <strong>Plots</strong>, and the <strong>Services</strong> module for property services. You can manage plots under <em>Content → Projects</em> in the sidebar.
                    Theme developers can rename modules for any use-case by setting <code>moduleAliases</code> in <code>theme.json</code>.
                </p>
            </div>
        </div>
    );
}
