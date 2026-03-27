'use client';

import { ChevronDownIcon, ChevronUpIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export interface SchemaField {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'image' | 'number' | 'button' | 'buttons' | 'stats' | 'select';
    placeholder?: string;
    max?: number;
    description?: string;
    options?: string[];
    showWhen?: { field: string; hasValue: boolean };
}

export interface SchemaSection {
    id: string;
    label: string;
    description?: string;
    fields: SchemaField[];
}

export interface ThemePageConfig {
    slug: string;
    label: string;
    sections: SchemaSection[];
}

export interface SectionData {
    id: string;
    enabled: boolean;
    data: Record<string, any>;
}

interface SectionEditorProps {
    schema: SchemaSection[];
    sections: SectionData[];
    onChange: (sections: SectionData[]) => void;
}

export default function SectionEditor({ schema, sections, onChange }: SectionEditorProps) {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const getSectionData = (id: string): SectionData =>
        sections.find(s => s.id === id) ?? { id, enabled: true, data: {} };

    const updateSection = (id: string, updates: Partial<SectionData>) => {
        onChange(
            schema.map(sc => {
                const current = getSectionData(sc.id);
                return sc.id === id ? { ...current, ...updates } : current;
            })
        );
    };

    const updateField = (sectionId: string, key: string, value: any) => {
        const sec = getSectionData(sectionId);
        updateSection(sectionId, { data: { ...sec.data, [key]: value } });
    };

    const toggleExpand = (id: string) =>
        setExpanded(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    const inputClass = 'w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10';

    const renderField = (sectionId: string, field: SchemaField) => {
        const val = getSectionData(sectionId).data[field.key];

        switch (field.type) {
            case 'text':
            case 'image':
                return (
                    <input
                        type="text"
                        value={val ?? ''}
                        placeholder={field.placeholder ?? ''}
                        onChange={e => updateField(sectionId, field.key, e.target.value)}
                        className={inputClass}
                    />
                );

            case 'number':
                return (
                    <input
                        type="number"
                        value={val ?? ''}
                        placeholder={field.placeholder ?? ''}
                        onChange={e => updateField(sectionId, field.key, e.target.value)}
                        className={inputClass}
                    />
                );

            case 'textarea':
                return (
                    <textarea
                        value={val ?? ''}
                        placeholder={field.placeholder ?? ''}
                        onChange={e => updateField(sectionId, field.key, e.target.value)}
                        rows={3}
                        className={`${inputClass} resize-none`}
                    />
                );

            case 'button': {
                const btn = val ?? { text: '', url: '' };
                return (
                    <div className="flex gap-2">
                        <input type="text" value={btn.text ?? ''} placeholder="Button text"
                            onChange={e => updateField(sectionId, field.key, { ...btn, text: e.target.value })}
                            className={`${inputClass} flex-1`} />
                        <input type="text" value={btn.url ?? ''} placeholder="URL"
                            onChange={e => updateField(sectionId, field.key, { ...btn, url: e.target.value })}
                            className={`${inputClass} flex-1`} />
                    </div>
                );
            }

            case 'buttons': {
                const btns: { text: string; url: string }[] = val ?? [];
                const max = field.max ?? 3;
                return (
                    <div className="space-y-2">
                        {btns.map((btn, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <input type="text" value={btn.text ?? ''} placeholder="Button text"
                                    onChange={e => {
                                        const next = [...btns]; next[i] = { ...btn, text: e.target.value };
                                        updateField(sectionId, field.key, next);
                                    }}
                                    className={`${inputClass} flex-1`} />
                                <input type="text" value={btn.url ?? ''} placeholder="URL"
                                    onChange={e => {
                                        const next = [...btns]; next[i] = { ...btn, url: e.target.value };
                                        updateField(sectionId, field.key, next);
                                    }}
                                    className={`${inputClass} flex-1`} />
                                <button onClick={() => updateField(sectionId, field.key, btns.filter((_, j) => j !== i))}
                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {btns.length < max && (
                            <button onClick={() => updateField(sectionId, field.key, [...btns, { text: '', url: '' }])}
                                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                                <PlusIcon className="w-3.5 h-3.5" /> Add Button
                            </button>
                        )}
                    </div>
                );
            }

            case 'stats': {
                const stats: { value: string; label: string }[] = val ?? [];
                const max = field.max ?? 4;
                return (
                    <div className="space-y-2">
                        {stats.map((stat, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <input type="text" value={stat.value ?? ''} placeholder="Value (e.g. 500+)"
                                    onChange={e => {
                                        const next = [...stats]; next[i] = { ...stat, value: e.target.value };
                                        updateField(sectionId, field.key, next);
                                    }}
                                    className={`${inputClass} w-32`} />
                                <input type="text" value={stat.label ?? ''} placeholder="Label (e.g. Plots Sold)"
                                    onChange={e => {
                                        const next = [...stats]; next[i] = { ...stat, label: e.target.value };
                                        updateField(sectionId, field.key, next);
                                    }}
                                    className={`${inputClass} flex-1`} />
                                <button onClick={() => updateField(sectionId, field.key, stats.filter((_, j) => j !== i))}
                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {stats.length < max && (
                            <button onClick={() => updateField(sectionId, field.key, [...stats, { value: '', label: '' }])}
                                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                                <PlusIcon className="w-3.5 h-3.5" /> Add Stat
                            </button>
                        )}
                    </div>
                );
            }

            case 'select': {
                const options = field.options ?? [];
                return (
                    <select
                        value={val ?? options[0] ?? ''}
                        onChange={e => updateField(sectionId, field.key, e.target.value)}
                        className={inputClass}
                    >
                        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                );
            }

            default:
                return null;
        }
    };

    if (!schema || schema.length === 0) return null;

    return (
        <div className="space-y-3">
            {schema.map(schemaSection => {
                const sec = getSectionData(schemaSection.id);
                const isExpanded = expanded.has(schemaSection.id);

                return (
                    <div key={schemaSection.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-3 p-4 cursor-pointer select-none"
                            onClick={() => toggleExpand(schemaSection.id)}>
                            <button
                                onClick={e => { e.stopPropagation(); updateSection(schemaSection.id, { enabled: !sec.enabled }); }}
                                className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${sec.enabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${sec.enabled ? 'translate-x-5' : ''}`} />
                            </button>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900">{schemaSection.label}</p>
                                {schemaSection.description && (
                                    <p className="text-xs text-slate-400 truncate">{schemaSection.description}</p>
                                )}
                            </div>
                            {isExpanded
                                ? <ChevronUpIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                : <ChevronDownIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                        </div>

                        {isExpanded && schemaSection.fields.length > 0 && (
                            <div className="border-t border-slate-100 p-4 space-y-4">
                                {schemaSection.fields.map(field => {
                                    // Conditional visibility: showWhen
                                    if (field.showWhen) {
                                        const watchedVal = getSectionData(schemaSection.id).data[field.showWhen.field];
                                        const hasValue = watchedVal !== undefined && watchedVal !== null && watchedVal !== '';
                                        if (field.showWhen.hasValue !== hasValue) {
                                            return (
                                                <div key={field.key} className="opacity-40 pointer-events-none select-none">
                                                    <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1 block">
                                                        {field.label}
                                                    </label>
                                                    <p className="text-xs text-slate-300 italic">
                                                        {field.showWhen.hasValue
                                                            ? `Set a background image above to enable this field`
                                                            : `Remove the background image to enable this field`}
                                                    </p>
                                                </div>
                                            );
                                        }
                                    }
                                    return (
                                        <div key={field.key}>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                                                {field.label}
                                            </label>
                                            {field.description && (
                                                <p className="text-xs text-slate-400 mb-1.5">{field.description}</p>
                                            )}
                                            {renderField(schemaSection.id, field)}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
