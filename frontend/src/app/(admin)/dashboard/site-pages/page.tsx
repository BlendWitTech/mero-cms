'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    DocumentTextIcon,
    ChevronRightIcon,
    ChevronUpIcon,
    ChevronDownIcon,
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
import dynamic from 'next/dynamic';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import MediaPickerModal from '@/components/ui/MediaPickerModal';
import EmojiPicker from 'emoji-picker-react';
import { SERVICE_ICONS } from '@/lib/service-icons';

import { usePermissions } from '@/context/PermissionsContext';
import SectionPaletteModal from '@/components/dashboard/SectionPaletteModal';

const PostEditor = dynamic(() => import('@/components/blog/PostEditor'), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

interface FieldDef {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'richtext' | 'image' | 'number' | 'toggle' | 'button' | 'buttons' | 'url' | 'stats' | 'select' | 'emoji' | 'icon' | 'divider';
    placeholder?: string;
    description?: string;
    max?: number;
    options?: string[];
    /** When true, the stats field shows an emoji picker instead of a text input for the value column */
    emojiPicker?: boolean;
    /** Settings table key to seed from when no page section data exists */
    settingsKey?: string;
    /** Hard-coded fallback shown when neither page data nor settings has a value */
    defaultValue?: any;
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

// ─── Emoji and Icon pickers  ────────────────────────────────────────────────────────

function IconValueField({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled: boolean }) {
    const [open, setOpen] = useState(false);
    
    // Find selected icon
    const selectedIcon = SERVICE_ICONS.find(ic => ic.name === value);

    return (
        <div className="relative">
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(!open)}
                className="w-16 h-10 border border-slate-200 rounded-xl flex items-center justify-center bg-white hover:border-blue-300 transition-all disabled:opacity-50 shadow-sm"
                title="Click to pick an icon"
            >
                {selectedIcon ? <selectedIcon.icon className="w-5 h-5 text-slate-700" /> : <span className="text-slate-300 text-xs font-bold">Pick</span>}
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute z-20 top-full mt-2 left-0 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 w-80 max-h-80 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-5 gap-2">
                            {SERVICE_ICONS.map(ic => {
                                const isSelected = value === ic.name;
                                return (
                                    <button
                                        key={ic.name}
                                        type="button"
                                        title={ic.label}
                                        onClick={() => { onChange(ic.name); setOpen(false); }}
                                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${isSelected ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-100 hover:border-slate-300 text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <ic.icon className="w-6 h-6 stroke-[1.5]" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function EmojiValueField({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled: boolean }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(!open)}
                className="w-full h-10 border border-slate-200 rounded-xl text-xl flex items-center justify-center bg-white hover:border-red-300 transition-all disabled:opacity-50 shadow-sm"
                title="Click to pick an emoji"
            >
                {value ? <span>{value}</span> : <span className="text-slate-300 text-xs font-bold">Pick</span>}
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute z-20 top-full mt-1 left-0 rounded-2xl overflow-hidden shadow-2xl">
                        <EmojiPicker 
                            onEmojiClick={(emojiData) => { onChange(emojiData.emoji); setOpen(false); }} 
                            width={320} 
                            height={400} 
                        />
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Image field (own component so useState is always called at top level) ────

function ImageField({ value, onChange, disabled, base }: { value: any; onChange: (v: any) => void; disabled: boolean; base: string }) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const previewSrc = value ? (value.startsWith('http') ? value : `${API_BASE}${value}`) : '';
    return (
        <div className="space-y-2">
            <div className="flex gap-2 items-center">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setPickerOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition-all disabled:opacity-40 shrink-0 shadow"
                >
                    <PhotoIcon className="w-4 h-4" />
                    Choose Image
                </button>
                <input
                    type="text"
                    disabled={disabled}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="or paste URL / path"
                    className={base + ' flex-1'}
                />
                {value && (
                    <button type="button" disabled={disabled} onClick={() => onChange('')} className="p-2 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40">
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
            {previewSrc && (
                <div className="relative h-24 w-32 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                    <img src={previewSrc} alt="preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
            )}
            <MediaPickerModal
                isOpen={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={(url) => { onChange(url); setPickerOpen(false); }}
                current={value}
            />
        </div>
    );
}

// ─── Field renderer ──────────────────────────────────────────────────────────

function FieldEditor({ field, value, onChange, disabled }: {
    field: FieldDef;
    value: any;
    onChange: (v: any) => void;
    disabled: boolean;
}) {
    const base = 'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all bg-white disabled:opacity-50';

    if (field.type === 'divider') {
        return null; // rendered inline by SectionCard, not here
    }

    if (field.type === 'richtext') {
        return (
            <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
                <PostEditor content={value || ''} onChange={onChange} />
            </div>
        );
    }

    if (field.type === 'textarea') {
        const lineCount = (value || '').split('\n').length;
        const rows = Math.max(2, Math.min(lineCount + 1, 10));
        return (
            <textarea
                rows={rows}
                disabled={disabled}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={field.placeholder}
                className={base + ' resize-none leading-relaxed'}
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
        return <ImageField value={value} onChange={onChange} disabled={disabled} base={base} />;
    }

    if (field.type === 'button') {
        const btn = value || { text: '', url: '' };
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

    if (field.type === 'stats') {
        const items: { value: string; label: string }[] = Array.isArray(value) ? value : [];
        const max = field.max || 4;
        return (
            <div className="space-y-2">
                {items.length === 0 && (
                    <p className="text-xs text-slate-400 italic mb-1">No stats yet. Add up to {max} counter items.</p>
                )}
                {items.map((stat, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <div className="flex flex-col gap-1 w-16 shrink-0">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{field.emojiPicker ? 'Emoji' : 'Value'}</span>
                            {field.emojiPicker ? (
                                <EmojiValueField
                                    value={stat.value || ''}
                                    onChange={(v) => { const ns = [...items]; ns[i] = { ...ns[i], value: v }; onChange(ns); }}
                                    disabled={disabled}
                                />
                            ) : (
                                <input type="text" disabled={disabled} value={stat.value || ''} onChange={(e) => { const ns = [...items]; ns[i] = { ...ns[i], value: e.target.value }; onChange(ns); }} placeholder="500+" className={base + ' text-center font-bold'} />
                            )}
                        </div>
                        <div className="flex flex-col gap-1 flex-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Label</span>
                            <input type="text" disabled={disabled} value={stat.label || ''} onChange={(e) => { const ns = [...items]; ns[i] = { ...ns[i], label: e.target.value }; onChange(ns); }} placeholder="Units Sold" className={base} />
                        </div>
                        <button disabled={disabled} onClick={() => onChange(items.filter((_, j) => j !== i))} className="p-2 text-red-400 hover:text-red-600 disabled:opacity-40 mt-4">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {items.length < max && (
                    <button disabled={disabled} onClick={() => onChange([...items, { value: '', label: '' }])} className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-40 mt-1">
                        <PlusIcon className="w-4 h-4" /> Add Stat
                    </button>
                )}
            </div>
        );
    }

    if (field.type === 'select' && field.options) {
        return (
            <select
                disabled={disabled}
                value={value || field.options[0] || ''}
                onChange={(e) => onChange(e.target.value)}
                className={base + ' cursor-pointer'}
            >
                {field.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        );
    }

    if (field.type === 'emoji') {
        return (
            <div className="w-20">
                <EmojiValueField value={value || ''} onChange={onChange} disabled={disabled} />
            </div>
        );
    }

    if (field.type === 'icon') {
        return (
            <div className="w-24">
                <IconValueField value={value || ''} onChange={onChange} disabled={disabled} />
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

function SectionCard({ sectionDef, sectionData, onToggle, onDataChange, onRemove, onMoveUp, onMoveDown, saving, isEnterprise }: {
    sectionDef: SectionDef;
    sectionData: SectionData;
    onToggle: () => void;
    onDataChange: (key: string, value: any) => void;
    onRemove: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    saving: boolean;
    isEnterprise: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const enabled = sectionData.enabled;
    const hasFields = sectionDef.fields.length > 0;

    return (
        <div className={`border rounded-2xl transition-all ${enabled ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-4 bg-white rounded-t-2xl ${expanded ? 'border-b border-slate-50' : ''}`}>
                <div className="flex items-center gap-3">
                    {isEnterprise && (
                        <div className="flex flex-col gap-1 mr-1">
                            <button onClick={onMoveUp} disabled={saving} className="p-0.5 text-slate-300 hover:text-red-500 disabled:opacity-0"><ChevronUpIcon className="w-4 h-4" /></button>
                            <button onClick={onMoveDown} disabled={saving} className="p-0.5 text-slate-300 hover:text-red-500 disabled:opacity-0"><ChevronDownIcon className="w-4 h-4" /></button>
                        </div>
                    )}
                    <div className={`w-2.5 h-2.5 rounded-full ${enabled ? 'bg-green-500' : 'bg-slate-300'}`} />
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm">{sectionDef.label}</h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider">{sectionDef.id}</p>
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
                        </button>
                    )}
                    {isEnterprise && (
                        <button
                            onClick={onRemove}
                            disabled={saving}
                            className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Remove section from page"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Editable fields */}
            {expanded && hasFields && (
                <div className="bg-slate-50 border-t border-slate-100 px-5 py-4 space-y-4">
                    {sectionDef.fields.map((field) => {
                        if (field.type === 'divider') {
                            return (
                                <div key={field.key} className="flex items-center gap-3 pt-1">
                                    <div className="h-px bg-slate-200 flex-1" />
                                    {field.label && (
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{field.label}</span>
                                    )}
                                    <div className="h-px bg-slate-200 flex-1" />
                                </div>
                            );
                        }
                        return (
                            <div key={field.key}>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{field.label}</label>
                                {field.description && <p className="text-xs text-slate-400 mb-1.5">{field.description}</p>}
                                <FieldEditor
                                    field={field}
                                    value={sectionData.data?.[field.key]}
                                    onChange={(v) => onDataChange(field.key, v)}
                                    disabled={saving || !enabled}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SitePagesPage() {
    const { showToast } = useNotification();
    const { license } = usePermissions();
    const isEnterprise = license?.tierName === 'Enterprise' || license?.tier >= 3;

    const [pageSchema, setPageSchema] = useState<PageDef[]>([]);
    const [activePage, setActivePage] = useState<string>('');
    const [pagesData, setPagesData] = useState<Record<string, PageSections>>({});
    const [pageLayouts, setPageLayouts] = useState<Record<string, string[]>>({}); // order of section IDs

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);

    // Load schema + current saved data
    const load = useCallback(async () => {
        setIsLoading(true);
        try {
            const [schemaRes, pagesRes, settingsRes] = await Promise.all([
                apiRequest('/themes/active/page-schema'),
                apiRequest('/pages'),
                apiRequest('/settings').catch(() => ({})),
            ]);
            // Controller returns array directly; fall back to legacy wrapper just in case
            const schema: PageDef[] = Array.isArray(schemaRes) ? schemaRes : (schemaRes?.pageSchema || []);
            // Settings returns a flat { key: value } object
            const settingsMap: Record<string, string> = (settingsRes && typeof settingsRes === 'object' && !Array.isArray(settingsRes)) ? settingsRes : {};

            setPageSchema(schema);
            if (schema.length > 0 && !activePage) setActivePage(schema[0].slug);

            // Build initial sections state from saved Page records
            const savedData: Record<string, PageSections> = {};
            const savedLayouts: Record<string, string[]> = {};

            for (const pageDef of schema) {
                const pageRecord = Array.isArray(pagesRes) ? pagesRes.find((p: any) => p.slug === pageDef.slug) : null;
                const rawSections: any[] = pageRecord?.data?.sections || [];
                const sections: PageSections = {};
                const layout: string[] = [];

                if (rawSections.length > 0) {
                    // Use saved order but merge with schema for field defaults
                    for (const s of rawSections) {
                        layout.push(s.id);
                        
                        // Find section definition for defaults
                        const secDef = pageDef.sections.find(sd => sd.id === s.id);
                        const fieldsData: Record<string, any> = { ...(s.data || {}) };
                        
                        if (secDef) {
                            for (const field of secDef.fields) {
                                if (fieldsData[field.key] === undefined) {
                                    if (field.settingsKey && settingsMap[field.settingsKey]) {
                                        fieldsData[field.key] = settingsMap[field.settingsKey];
                                    } else if (field.defaultValue !== undefined) {
                                        fieldsData[field.key] = field.defaultValue;
                                    }
                                }
                            }
                        }
                        
                        sections[s.id] = { enabled: s.enabled !== false, data: fieldsData };
                    }
                } else {
                    // Fresh page — use schema order
                    for (const sec of pageDef.sections) {
                        layout.push(sec.id);
                        const fieldsData: Record<string, any> = {};
                        for (const field of sec.fields) {
                            if (field.settingsKey && settingsMap[field.settingsKey]) {
                                fieldsData[field.key] = settingsMap[field.settingsKey];
                            } else if (field.defaultValue !== undefined) {
                                fieldsData[field.key] = field.defaultValue;
                            }
                        }
                        sections[sec.id] = { enabled: true, data: fieldsData };
                    }
                }
                savedData[pageDef.slug] = sections;
                savedLayouts[pageDef.slug] = layout;
            }
            setPagesData(savedData);
            setPageLayouts(savedLayouts);
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

    const moveSection = (index: number, direction: 'up' | 'down') => {
        const layout = [...(pageLayouts[activePage] || [])];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= layout.length) return;
        [layout[index], layout[newIndex]] = [layout[newIndex], layout[index]];
        setPageLayouts(prev => ({ ...prev, [activePage]: layout }));
    };

    const removeSection = (sectionId: string) => {
        setPageLayouts(prev => ({ ...prev, [activePage]: (prev[activePage] || []).filter(id => id !== sectionId) }));
    };

    const addSectionFromPalette = (secDef: any) => {
        const newId = `${secDef.type}_${Date.now()}`;
        const defaultData: Record<string, any> = {};
        secDef.fields.forEach((f: any) => { if (f.defaultValue !== undefined) defaultData[f.key] = f.defaultValue; });

        setPagesData(prev => ({
            ...prev,
            [activePage]: { ...prev[activePage], [newId]: { enabled: true, data: defaultData } }
        }));
        setPageLayouts(prev => ({ ...prev, [activePage]: [...(prev[activePage] || []), newId] }));
        
        setIsPaletteOpen(false);
        showToast(`${secDef.label} section added.`, 'success');
    };

    const save = async () => {
        if (!currentPageDef) return;
        setIsSaving(true);
        try {
            const layoutIds = pageLayouts[activePage] || [];
            const sections = layoutIds.map(id => {
                const secState = pagesData[activePage]?.[id];
                return { id, enabled: secState?.enabled ?? true, data: secState?.data || {} };
            });

            await apiRequest(`/pages/by-slug/${activePage}`, 'PUT', {
                title: currentPageDef.label,
                status: 'PUBLISHED',
                data: { sections },
            });
            showToast('Page layout and content saved successfully.', 'success');
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
            <div className="p-8 text-center max-w-lg mx-auto">
                <Squares2X2Icon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h2 className="font-bold text-slate-800 text-lg">This theme doesn't support page editing</h2>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                    The active theme hasn't defined a <code className="bg-slate-100 px-1 rounded">pageSchema</code> in its <code className="bg-slate-100 px-1 rounded">theme.json</code>.
                    Only themes built for this CMS expose their pages here.
                </p>
                <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200 text-left">
                    <p className="text-xs font-bold text-amber-800 mb-1">For theme developers:</p>
                    <p className="text-xs text-amber-700 leading-relaxed">
                        Add a <code className="bg-amber-100 px-1 rounded">pageSchema</code> array to your <code className="bg-amber-100 px-1 rounded">theme.json</code> to define which pages and sections are editable.
                        See the <code className="bg-amber-100 px-1 rounded">cms-starter</code> theme as a reference implementation.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-20">
            {/* Header — sticky so Save button stays reachable while scrolling */}
            <div className="sticky top-0 z-10 flex items-center justify-between -mx-8 px-8 py-4 mb-4 bg-[#F8FAFC]/95 backdrop-blur-sm border-b border-slate-100">
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

            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                {/* Page sidebar — horizontal scroll on mobile, sticky sidebar on desktop */}
                <div className="md:w-52 md:shrink-0">
                    <div className="md:sticky md:top-0 flex md:flex-col flex-row flex-wrap gap-1.5 md:gap-0 md:space-y-1.5 pt-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-3 w-full">Pages</p>
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
                </div>

                {/* Sections editor */}
                <div className="flex-1 space-y-3">
                    {currentPageDef ? (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="font-bold text-slate-800 text-lg">{currentPageDef.label}</h2>
                                    <p className="text-xs text-slate-400">Manage your page layout and section content.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isEnterprise && (
                                        <button
                                            onClick={() => setIsPaletteOpen(true)}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                                        >
                                            <PlusIcon className="w-4 h-4" /> Add Section
                                        </button>
                                    )}
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                        <DocumentTextIcon className="w-4 h-4" />
                                        /{activePage}
                                    </div>
                                </div>
                            </div>

                            {(pageLayouts[activePage] || []).map((id, i) => {
                                // Find definition from schema by section type prefix if exact ID not found
                                let secDef = currentPageDef.sections.find(s => s.id === id);
                                if (!secDef) {
                                    const type = id.split('_')[0];
                                    // Try to find a section with this type in ANY page schema (or use a global map)
                                    // For now, scan all pages in schema
                                    for (const p of pageSchema) {
                                        const found = p.sections.find(s => (s as any).type === type || s.id === type);
                                        if (found) { secDef = found; break; }
                                    }
                                }
                                if (!secDef) return null;

                                return (
                                    <SectionCard
                                        key={id}
                                        isEnterprise={isEnterprise}
                                        sectionDef={secDef}
                                        sectionData={currentSections[id] || { enabled: true, data: {} }}
                                        onToggle={() => toggleSection(id)}
                                        onDataChange={(key, value) => updateSectionData(id, key, value)}
                                        onRemove={() => removeSection(id)}
                                        onMoveUp={() => moveSection(i, 'up')}
                                        onMoveDown={() => moveSection(i, 'down')}
                                        saving={isSaving}
                                    />
                                );
                            })}
                        </>
                    ) : (
                        <div className="text-center py-20 text-slate-400">Select a page to edit its sections.</div>
                    )}
                </div>
            </div>

            <SectionPaletteModal 
                isOpen={isPaletteOpen} 
                onClose={() => setIsPaletteOpen(false)} 
                onSelect={addSectionFromPalette} 
            />

            {/* Module Aliases info box */}
            <div className="mt-10 bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <h3 className="font-bold text-amber-800 text-sm mb-2">About Content Modules</h3>
                <p className="text-xs text-amber-700 leading-relaxed">
                    Dynamic content like team members, testimonials, and services is managed under <em>Content</em> in the sidebar.
                    Theme developers can customise which sections appear on each page by editing <code>pageSchema</code> in <code>theme.json</code>.
                </p>
            </div>
        </div>
    );
}
