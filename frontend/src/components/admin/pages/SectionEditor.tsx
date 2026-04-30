'use client';

import { ChevronDownIcon, ChevronUpIcon, PlusIcon, TrashIcon, PhotoIcon, InformationCircleIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import Link from 'next/link';
import MediaPickerModal from '@/components/ui/MediaPickerModal';

export interface SchemaField {
    key: string;
    label: string;
    /** Field types:
        - 'string' / 'text': plain text input.
        - 'textarea' / 'richtext': multi-line text input.
        - 'image' / 'media': opens MediaPickerModal; stores the URL.
        - 'number': numeric input.
        - 'button' / 'buttons': structured button editor.
        - 'stats': legacy stats grid editor.
        - 'select': dropdown.
        - 'color': native color picker + hex input.
        - 'slider' / 'range': numeric scrubber bounded by min/max/step,
          with a live numeric readout (and optional unit label).
        - 'font': dropdown of curated font-family stacks. The value
          stored is the full CSS font-family stack so the theme can
          drop it straight into a `style={{ fontFamily }}` prop.
        - 'repeater': structured array of objects. Unlike `json`, the
          repeater knows the per-item schema up front (via `itemSchema`)
          and renders one labelled sub-field per row — friendlier than
          a free-form JSON textarea for non-developer editors.
        - 'json': structured array editor (or JSON textarea fallback).
        - 'managed': read-only info card pointing to where this content
          is actually managed (the relevant content collection — e.g.
          Testimonials live in /dashboard/testimonials, not in the
          section's data field). Use this on schema fields whose data
          is pulled from a collection at render time, so the editor
          doesn't show `[object Object]` and confuse the user. */
    type:
        | 'text' | 'string' | 'textarea' | 'richtext'
        | 'image' | 'media' | 'number'
        | 'button' | 'buttons' | 'stats' | 'select' | 'json' | 'managed'
        | 'color' | 'slider' | 'range' | 'font' | 'repeater';
    placeholder?: string;
    max?: number;
    /** Lower bound for `slider` / `range` / `number`. Defaults vary by
        type — slider/range default to 0, number is unbounded. */
    min?: number;
    /** Step size for `slider` / `range` / `number`. Default 1. */
    step?: number;
    /** Units suffix shown next to the slider value (e.g. "px", "%"). */
    unit?: string;
    description?: string;
    options?: string[];
    showWhen?: { field: string; hasValue: boolean };
    /** For type='managed': the destination the user should be sent to
        manage the actual content. Renders as a deep-link button on the
        info card (e.g. '/dashboard/testimonials'). */
    managedHref?: string;
    /** For type='managed': human-readable name of the collection this
        section pulls from (e.g. "Testimonials", "Services", "Team"). */
    managedLabel?: string;
    /** For type='repeater': declares the per-item field shape. Each
        row in the repeater renders these as labelled sub-inputs. Only
        primitive sub-types are supported (text/string/textarea/number/
        select/color/image) — nesting another repeater would explode
        the inspector and is intentionally not allowed. */
    itemSchema?: Array<{
        key: string;
        label: string;
        type: 'text' | 'string' | 'textarea' | 'number' | 'select' | 'color' | 'image' | 'media';
        placeholder?: string;
        options?: string[];
    }>;
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
    /** When set, the media picker modal is open for { sectionId, fieldKey }.
        On select, we write the URL to the corresponding field. */
    const [mediaPickerFor, setMediaPickerFor] = useState<{ sectionId: string; fieldKey: string } | null>(null);

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

    /**
     * Write into a dotted path like `gallery.2.imageUrl` — used by the
     * repeater field's nested image picker. Splits on '.', traverses
     * (or creates) intermediate objects/arrays, and immutably writes
     * the leaf value back. Numeric path segments become array indices.
     */
    const updateFieldPath = (sectionId: string, path: string, value: any) => {
        const parts = path.split('.');
        if (parts.length === 1) return updateField(sectionId, path, value);
        const sec  = getSectionData(sectionId);
        const root = { ...sec.data };
        let cursor: any = root;
        for (let i = 0; i < parts.length - 1; i++) {
            const seg = parts[i];
            const nextSeg = parts[i + 1];
            const nextIsIndex = /^\d+$/.test(nextSeg);
            const existing = cursor[seg];
            const cloned = Array.isArray(existing)
                ? [...existing]
                : (existing && typeof existing === 'object'
                    ? { ...existing }
                    : (nextIsIndex ? [] : {}));
            cursor[seg] = cloned;
            cursor = cloned;
        }
        cursor[parts[parts.length - 1]] = value;
        updateSection(sectionId, { data: root });
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
            // 'text' and 'string' are aliases — both produce a single-line input.
            case 'text':
            case 'string':
                return (
                    <input
                        type="text"
                        // Defensive String() coercion: if the stored value is
                        // an object/array (legacy data, schema mismatch),
                        // <input> would render '[object Object]'. Empty string
                        // is the safe fallback — the user can retype.
                        value={typeof val === 'string' || typeof val === 'number' ? String(val) : ''}
                        placeholder={field.placeholder ?? ''}
                        onChange={e => updateField(sectionId, field.key, e.target.value)}
                        className={inputClass}
                    />
                );

            // Image / media fields open the media-picker modal. Show a
            // thumbnail preview + the URL when set. Defensive against
            // legacy values that stored a full Media object — extract
            // the .url so the field still works without a one-time
            // migration.
            case 'image':
            case 'media': {
                const url = typeof val === 'string'
                    ? val
                    : (val && typeof val === 'object' && typeof (val as any).url === 'string')
                        ? (val as any).url
                        : '';
                const filename = url ? url.split('/').pop() || url : '';
                return (
                    <div data-field-key={field.key}>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setMediaPickerFor({ sectionId, fieldKey: field.key })}
                                className="group flex items-center gap-3 flex-1 px-3 py-2 bg-slate-50 border border-dashed border-slate-300 hover:border-blue-400 rounded-xl text-left transition-colors cursor-pointer"
                            >
                                <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                    {url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={url}
                                            alt={field.label}
                                            className="h-full w-full object-contain"
                                            onError={(e) => {
                                                // Failed to load (404, CORS, etc.) — fall back to icon.
                                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <PhotoIcon className="w-5 h-5 text-slate-400" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-700 truncate">
                                        {filename || 'Pick an image…'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 truncate" title={url}>
                                        {url || 'Click to open the media library'}
                                    </p>
                                </div>
                            </button>
                            {url && (
                                <button
                                    type="button"
                                    onClick={() => updateField(sectionId, field.key, '')}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Clear image"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        {/* Allow direct URL editing too — useful for pasting
                            a link without going through the media picker. */}
                        {url !== '' && (
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => updateField(sectionId, field.key, e.target.value)}
                                className="mt-2 w-full text-[11px] font-mono bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-slate-600"
                                placeholder="https://… or /uploads/…"
                            />
                        )}
                    </div>
                );
            }

            // 'managed' fields — read-only info card explaining the
            // content lives elsewhere. Used for sections that pull from
            // content collections (Testimonials, Services, Team, blog
            // posts) where editing inline doesn't make sense — there's
            // a dedicated admin page for those.
            case 'managed':
                return (
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 flex items-start gap-3">
                        <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-none mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 mb-0.5">
                                Managed in {field.managedLabel || 'a content section'}
                            </p>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                {field.description ||
                                    `This section pulls its content from your ${field.managedLabel || 'content'} collection. Add, edit, or reorder items there — they'll automatically appear here.`}
                            </p>
                            {field.managedHref && (
                                <Link
                                    href={field.managedHref}
                                    className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:underline"
                                >
                                    Open {field.managedLabel || 'editor'}
                                    <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                                </Link>
                            )}
                        </div>
                    </div>
                );

            // JSON fields — typically arrays of objects (FeatureBlocks.blocks,
            // Testimonials.testimonials, FAQ.items, etc.). Render a repeating
            // editor: one card per item, with one input per discovered key.
            // For arrays of strings (LogoStrip.logos before split, etc.) we
            // render a multi-line textarea. For everything else we expose a
            // raw JSON textarea so power users can hand-edit structures we
            // don't have a typed editor for.
            case 'json':
                return <JsonFieldEditor
                    value={val}
                    onChange={(next) => updateField(sectionId, field.key, next)}
                    placeholder={field.placeholder}
                />;

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
                                <input type="text" value={stat.label ?? ''} placeholder="Label (e.g. Projects Done)"
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

            // 'richtext' is currently a multi-line textarea — same UI as
            // 'textarea' but kept as a separate type so the theme side
            // can switch to a Markdown / WYSIWYG editor later without a
            // schema migration. Theme renderers use renderMarkdownish()
            // already (see RichContent.tsx), so plain text is fine here.
            case 'richtext':
                return (
                    <textarea
                        value={val ?? ''}
                        placeholder={field.placeholder ?? ''}
                        onChange={e => updateField(sectionId, field.key, e.target.value)}
                        rows={6}
                        className={`${inputClass} resize-none font-mono text-[12px]`}
                    />
                );

            // Color picker — native <input type="color"> on the left,
            // a hex text input on the right so authors can paste / type
            // a value. Both wires write to the same field.
            case 'color': {
                const hex = typeof val === 'string' && val.startsWith('#') ? val : '#000000';
                return (
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={hex}
                            onChange={(e) => updateField(sectionId, field.key, e.target.value)}
                            className="h-9 w-12 rounded-lg border border-slate-200 cursor-pointer"
                            aria-label={`${field.label} color picker`}
                        />
                        <input
                            type="text"
                            value={typeof val === 'string' ? val : ''}
                            onChange={(e) => updateField(sectionId, field.key, e.target.value)}
                            placeholder={field.placeholder ?? '#cb172b'}
                            className={`${inputClass} font-mono text-[12px] flex-1`}
                            spellCheck={false}
                        />
                    </div>
                );
            }

            // Slider / range — bounded numeric scrubber. Stored as a
            // number so the theme can drop it straight into CSS.
            case 'slider':
            case 'range': {
                const min = field.min ?? 0;
                const max = field.max ?? 100;
                const step = field.step ?? 1;
                const numericVal = typeof val === 'number'
                    ? val
                    : (typeof val === 'string' && val !== '' ? Number(val) : min);
                const safeVal = Number.isFinite(numericVal) ? numericVal : min;
                return (
                    <div className="flex items-center gap-3">
                        <input
                            type="range"
                            min={min}
                            max={max}
                            step={step}
                            value={safeVal}
                            onChange={(e) => updateField(sectionId, field.key, Number(e.target.value))}
                            className="flex-1 accent-blue-600"
                        />
                        <div className="flex items-center gap-1 min-w-[64px] justify-end">
                            <input
                                type="number"
                                min={min}
                                max={max}
                                step={step}
                                value={safeVal}
                                onChange={(e) => updateField(sectionId, field.key, Number(e.target.value))}
                                className="w-16 text-xs font-mono text-right bg-slate-50 border border-slate-200 rounded-md py-1 px-1.5"
                            />
                            {field.unit && (
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                    {field.unit}
                                </span>
                            )}
                        </div>
                    </div>
                );
            }

            // Font picker — dropdown of curated font-family stacks plus
            // an "(custom)" option that flips to a free-text input so
            // power users can wire up self-hosted fonts. Stored value is
            // a full CSS font-family stack.
            case 'font': {
                const FONT_PRESETS: { label: string; stack: string }[] = field.options
                    ? field.options.map((o) => ({ label: o, stack: o }))
                    : [
                        { label: 'System UI', stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
                        { label: 'Inter',     stack: 'Inter, system-ui, sans-serif' },
                        { label: 'Manrope',   stack: 'Manrope, system-ui, sans-serif' },
                        { label: 'Plus Jakarta Sans', stack: '"Plus Jakarta Sans", system-ui, sans-serif' },
                        { label: 'Geist',     stack: 'Geist, system-ui, sans-serif' },
                        { label: 'Merriweather', stack: 'Merriweather, Georgia, serif' },
                        { label: 'Playfair Display', stack: '"Playfair Display", Georgia, serif' },
                        { label: 'JetBrains Mono', stack: '"JetBrains Mono", Menlo, monospace' },
                    ];
                const current = typeof val === 'string' ? val : '';
                const matchedPreset = FONT_PRESETS.find((f) => f.stack === current);
                const isCustom = current !== '' && !matchedPreset;
                return (
                    <div className="space-y-2">
                        <select
                            value={isCustom ? '__custom__' : current}
                            onChange={(e) => {
                                const v = e.target.value;
                                if (v === '__custom__') {
                                    // Seed with current value so the user can edit it.
                                    if (!current) updateField(sectionId, field.key, 'Inter, sans-serif');
                                } else {
                                    updateField(sectionId, field.key, v);
                                }
                            }}
                            className={inputClass}
                        >
                            <option value="">Inherit from theme</option>
                            {FONT_PRESETS.map((f) => (
                                <option key={f.label} value={f.stack} style={{ fontFamily: f.stack }}>
                                    {f.label}
                                </option>
                            ))}
                            <option value="__custom__">— Custom CSS font-family —</option>
                        </select>
                        {isCustom && (
                            <input
                                type="text"
                                value={current}
                                onChange={(e) => updateField(sectionId, field.key, e.target.value)}
                                placeholder='"My Font", system-ui, sans-serif'
                                className={`${inputClass} font-mono text-[12px]`}
                                spellCheck={false}
                            />
                        )}
                        {current && (
                            <p
                                className="text-sm text-slate-700 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100"
                                style={{ fontFamily: current }}
                            >
                                The quick brown fox jumps over the lazy dog
                            </p>
                        )}
                    </div>
                );
            }

            // Repeater — typed array editor. Each row renders one input
            // per declared `itemSchema` field. Reorder / delete buttons
            // on the right; "Add row" at the bottom. Falls back to the
            // free-form JSON editor when no itemSchema is provided so a
            // theme can opt in incrementally.
            case 'repeater': {
                if (!field.itemSchema || field.itemSchema.length === 0) {
                    return <JsonFieldEditor
                        value={val}
                        onChange={(next) => updateField(sectionId, field.key, next)}
                        placeholder={field.placeholder}
                    />;
                }
                const rows: Record<string, any>[] = Array.isArray(val) ? val : [];
                const max = field.max ?? 50;
                const writeRows = (next: Record<string, any>[]) =>
                    updateField(sectionId, field.key, next);
                const updateRow = (i: number, patch: Record<string, any>) => {
                    const next = [...rows];
                    next[i] = { ...next[i], ...patch };
                    writeRows(next);
                };
                const move = (i: number, dir: -1 | 1) => {
                    const j = i + dir;
                    if (j < 0 || j >= rows.length) return;
                    const next = [...rows];
                    const [item] = next.splice(i, 1);
                    next.splice(j, 0, item);
                    writeRows(next);
                };
                const remove = (i: number) => writeRows(rows.filter((_, j) => j !== i));
                const addRow = () => {
                    const blank: Record<string, any> = {};
                    for (const sub of field.itemSchema!) blank[sub.key] = '';
                    writeRows([...rows, blank]);
                };
                const renderSubField = (
                    rowIndex: number,
                    sub: NonNullable<SchemaField['itemSchema']>[number],
                ) => {
                    const v = rows[rowIndex]?.[sub.key];
                    const onChange = (next: any) => updateRow(rowIndex, { [sub.key]: next });
                    switch (sub.type) {
                        case 'textarea':
                            return (
                                <textarea
                                    value={typeof v === 'string' ? v : ''}
                                    placeholder={sub.placeholder ?? ''}
                                    onChange={(e) => onChange(e.target.value)}
                                    rows={2}
                                    className={`${inputClass} resize-none`}
                                />
                            );
                        case 'number':
                            return (
                                <input
                                    type="number"
                                    value={typeof v === 'number' || typeof v === 'string' ? v : ''}
                                    placeholder={sub.placeholder ?? ''}
                                    onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
                                    className={inputClass}
                                />
                            );
                        case 'select': {
                            const options = sub.options ?? [];
                            return (
                                <select
                                    value={typeof v === 'string' ? v : (options[0] ?? '')}
                                    onChange={(e) => onChange(e.target.value)}
                                    className={inputClass}
                                >
                                    {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            );
                        }
                        case 'color':
                            return (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={typeof v === 'string' && v.startsWith('#') ? v : '#000000'}
                                        onChange={(e) => onChange(e.target.value)}
                                        className="h-9 w-12 rounded-lg border border-slate-200 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={typeof v === 'string' ? v : ''}
                                        onChange={(e) => onChange(e.target.value)}
                                        placeholder="#cb172b"
                                        className={`${inputClass} font-mono text-[12px] flex-1`}
                                    />
                                </div>
                            );
                        case 'image':
                        case 'media':
                            return (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setMediaPickerFor({
                                                sectionId,
                                                fieldKey: `${field.key}.${rowIndex}.${sub.key}`,
                                            })
                                        }
                                        className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg"
                                    >
                                        {v ? 'Change' : 'Pick image'}
                                    </button>
                                    <input
                                        type="text"
                                        value={typeof v === 'string' ? v : ''}
                                        onChange={(e) => onChange(e.target.value)}
                                        placeholder="/uploads/…"
                                        className={`${inputClass} font-mono text-[11px] flex-1`}
                                    />
                                </div>
                            );
                        case 'text':
                        case 'string':
                        default:
                            return (
                                <input
                                    type="text"
                                    value={typeof v === 'string' || typeof v === 'number' ? String(v) : ''}
                                    placeholder={sub.placeholder ?? ''}
                                    onChange={(e) => onChange(e.target.value)}
                                    className={inputClass}
                                />
                            );
                    }
                };
                return (
                    <div className="space-y-2">
                        {rows.map((_, rowIndex) => (
                            <div
                                key={rowIndex}
                                className="rounded-xl border border-slate-200 bg-slate-50/40 p-3"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Item {rowIndex + 1}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => move(rowIndex, -1)}
                                            disabled={rowIndex === 0}
                                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Move up"
                                        >
                                            <ChevronUpIcon className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => move(rowIndex, 1)}
                                            disabled={rowIndex === rows.length - 1}
                                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Move down"
                                        >
                                            <ChevronDownIcon className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => remove(rowIndex)}
                                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                            title="Remove"
                                        >
                                            <TrashIcon className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {field.itemSchema!.map((sub) => (
                                        <div key={sub.key}>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
                                                {sub.label}
                                            </label>
                                            {renderSubField(rowIndex, sub)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {rows.length < max && (
                            <button
                                type="button"
                                onClick={addRow}
                                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50"
                            >
                                <PlusIcon className="w-3.5 h-3.5" /> Add Item
                            </button>
                        )}
                    </div>
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

            {/* Media picker modal — shared for every image/media field
                in every section. Opening is triggered by setting
                mediaPickerFor; on select we write the URL back to the
                right (sectionId, fieldKey) pair. */}
            {mediaPickerFor && (
                <MediaPickerModal
                    isOpen
                    onClose={() => setMediaPickerFor(null)}
                    onSelect={(url: string) => {
                        // Repeater image fields encode their target as
                        // `${parent}.${rowIndex}.${subKey}`. Detect the
                        // dotted path and route through updateFieldPath
                        // so we write into the array element rather than
                        // creating a stray top-level key.
                        if (mediaPickerFor.fieldKey.includes('.')) {
                            updateFieldPath(mediaPickerFor.sectionId, mediaPickerFor.fieldKey, url);
                        } else {
                            updateField(mediaPickerFor.sectionId, mediaPickerFor.fieldKey, url);
                        }
                        setMediaPickerFor(null);
                    }}
                />
            )}
        </div>
    );
}

/**
 * Editor for JSON-type fields. The value is typically:
 *   - An array of objects — render as repeating cards, one input per
 *     key discovered from the first item. Lets the editor add / remove
 *     / reorder items without writing JSON.
 *   - An array of primitives — render as one textarea per item.
 *   - Anything else — raw JSON textarea (power-user fallback).
 *
 * Why this exists: the previous renderField() had no `case 'json'`, so
 * fields like FeatureBlocks.blocks fell through to `default: return null`.
 * Authors saw a labelled empty space (or, when a child rendered the value
 * as a string elsewhere, the dreaded `[object Object]`). With this in
 * place the same data is editable as a real form.
 */
function JsonFieldEditor({
    value,
    onChange,
    placeholder,
}: {
    value: any;
    onChange: (next: any) => void;
    placeholder?: string;
}) {
    // Normalise the inbound value to an array if it looks like one.
    const arr: any[] = Array.isArray(value) ? value : [];
    const isArrayOfObjects = arr.length > 0 && arr.every(it => it && typeof it === 'object' && !Array.isArray(it));
    const isArrayOfPrimitives = arr.length > 0 && arr.every(it => typeof it === 'string' || typeof it === 'number');

    // Discover the field schema from the first item (when it's an
    // object). Each subsequent add inherits the same shape.
    const itemKeys = isArrayOfObjects ? Object.keys(arr[0]) : [];

    const inputClass = 'w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10';

    const updateItem = (i: number, key: string, fieldValue: any) => {
        const next = [...arr];
        next[i] = { ...(next[i] ?? {}), [key]: fieldValue };
        onChange(next);
    };
    const removeItem = (i: number) => onChange(arr.filter((_, j) => j !== i));
    const addItem = () => {
        if (isArrayOfObjects) {
            const blank = Object.fromEntries(itemKeys.map(k => [k, '']));
            onChange([...arr, blank]);
        } else if (isArrayOfPrimitives || arr.length === 0) {
            onChange([...arr, '']);
        } else {
            onChange([...arr, null]);
        }
    };

    // Array of objects — structured repeating editor.
    if (isArrayOfObjects) {
        return (
            <div className="space-y-3">
                {arr.map((item, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                #{i + 1}
                            </span>
                            <button
                                type="button"
                                onClick={() => removeItem(i)}
                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                                <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        {itemKeys.map(k => {
                            const v = item?.[k];
                            const isLong = typeof v === 'string' && v.length > 60;
                            // Nested string array (e.g. FeatureBlocks.blocks[].bullets):
                            // render as a textarea where each line is one entry.
                            // Much better than cramming a JSON.stringify'd array
                            // into an <input>, which is what previously showed the
                            // unfriendly "[\"item1\",\"item2\"]" string.
                            const isStringArray =
                                Array.isArray(v) && v.every(it => typeof it === 'string');
                            // Nested object: not editable inline. Show a tiny
                            // hint pointing at the JSON textarea fallback at
                            // the bottom (which renders the full structure for
                            // power users). Avoids the "[object Object]" trap.
                            const isObject =
                                v !== null &&
                                typeof v === 'object' &&
                                !Array.isArray(v);
                            return (
                                <div key={k}>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5 block">
                                        {k}
                                    </label>
                                    {isStringArray ? (
                                        <textarea
                                            value={(v as string[]).join('\n')}
                                            onChange={e =>
                                                updateItem(
                                                    i,
                                                    k,
                                                    e.target.value
                                                        .split(/\n/)
                                                        .map(line => line)
                                                        .filter((line, idx, arr) => idx < arr.length - 1 || line.length > 0),
                                                )
                                            }
                                            rows={Math.max(2, (v as string[]).length)}
                                            placeholder="One entry per line"
                                            className={`${inputClass} resize-none font-mono text-[12px]`}
                                        />
                                    ) : isObject ? (
                                        <div className="text-[11px] text-slate-500 italic px-2 py-2 bg-white border border-dashed border-slate-200 rounded-lg">
                                            Nested object — use the JSON view below to edit.
                                        </div>
                                    ) : isLong ? (
                                        <textarea
                                            value={typeof v === 'string' ? v : v == null ? '' : JSON.stringify(v)}
                                            onChange={e => updateItem(i, k, e.target.value)}
                                            rows={2}
                                            className={`${inputClass} resize-none`}
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={typeof v === 'string' || typeof v === 'number' ? String(v) : v == null ? '' : JSON.stringify(v)}
                                            onChange={e => updateItem(i, k, e.target.value)}
                                            className={inputClass}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
                <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                    <PlusIcon className="w-3.5 h-3.5" /> Add item
                </button>
            </div>
        );
    }

    // Array of primitives — list of plain text inputs.
    if (isArrayOfPrimitives) {
        return (
            <div className="space-y-2">
                {arr.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <input
                            type="text"
                            value={String(item)}
                            onChange={e => {
                                const next = [...arr];
                                next[i] = e.target.value;
                                onChange(next);
                            }}
                            className={`${inputClass} flex-1`}
                        />
                        <button
                            type="button"
                            onClick={() => removeItem(i)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                            <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                    <PlusIcon className="w-3.5 h-3.5" /> Add
                </button>
            </div>
        );
    }

    // Empty value or unstructured — show a JSON textarea + an Add button
    // that initialises with a single empty object so the structured
    // editor takes over once the user fills in keys.
    const stringified = (() => {
        if (value == null) return '';
        try { return JSON.stringify(value, null, 2); } catch { return ''; }
    })();
    return (
        <div className="space-y-2">
            <textarea
                value={stringified}
                placeholder={placeholder ?? 'Paste JSON, or click "Add item" to start'}
                onChange={e => {
                    const txt = e.target.value;
                    if (!txt.trim()) {
                        onChange(undefined);
                        return;
                    }
                    try {
                        onChange(JSON.parse(txt));
                    } catch {
                        // Invalid JSON — keep the raw text as a string so the
                        // user can keep typing without losing their input.
                        // Saving will surface the parse error upstream.
                        onChange(txt);
                    }
                }}
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-600/10 resize-y"
            />
            <button
                type="button"
                onClick={() => onChange([{}])}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
                <PlusIcon className="w-3.5 h-3.5" /> Start with one item
            </button>
        </div>
    );
}
