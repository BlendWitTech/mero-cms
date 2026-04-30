'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    CursorArrowRaysIcon,
    ComputerDesktopIcon,
    DeviceTabletIcon,
    DevicePhoneMobileIcon,
    ArrowPathIcon,
    PencilSquareIcon,
    EyeIcon,
    EyeSlashIcon,
    SparklesIcon,
    ArrowLeftIcon,
    TrashIcon,
    DocumentDuplicateIcon,
    Bars3Icon,
    LockClosedIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { Sparkles as LucideSparkles, Layers3 as LucideLayers3 } from 'lucide-react';
import { iconFor } from '@/lib/icon-resolver';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { useCapabilities } from '@/context/CapabilitiesContext';
import UpgradePrompt from '@/components/ui/UpgradePrompt';
import SectionEditor, {
    SchemaSection as EditorSchemaSection,
    SectionData as EditorSectionData,
} from '@/components/admin/pages/SectionEditor';

// ─── Types ──────────────────────────────────────────────────────────────────

interface FieldDef {
    key: string;
    label: string;
    type: string;
}
interface SectionDef {
    id: string;
    type?: string;
    label: string;
    fields: FieldDef[];
}
interface PageDef {
    slug: string;
    label: string;
    sections: SectionDef[];
}
interface SectionState {
    id: string;
    type?: string;
    enabled: boolean;
    data: Record<string, any>;
}
interface WidgetCatalogItem {
    type: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    premium: boolean;
    locked: boolean;
    fields: FieldDef[];
    /** When set, this widget was contributed by an installed plugin
        (Phase 6.1). The editor can show a "from <plugin>" label so
        authors know where the widget came from. Theme-native widgets
        leave this null. */
    pluginSlug?: string | null;
}
interface WidgetCatalogResponse {
    widgets: WidgetCatalogItem[];
    categories: { key: string; label: string; description?: string }[];
    proUnlocked: boolean;
    tier: string | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeInstanceId(type: string): string {
    const slug = type.toLowerCase();
    const rand =
        typeof crypto !== 'undefined' && (crypto as any)?.randomUUID
            ? (crypto as any).randomUUID().slice(0, 8)
            : Math.random().toString(36).slice(2, 10);
    return `${slug}-${rand}`;
}

// Icon resolution is delegated to `iconFor` (imported above) which looks
// up Lucide icons by name from the full lucide-react export — themes can
// declare any Lucide icon in widgetCatalog without an admin code change.

// ─── Main page ──────────────────────────────────────────────────────────────

/**
 * Visual editor — Elementor-style page builder.
 *
 * Runs in **full-screen mode**: a `fixed inset-0 z-[60]` overlay covers the
 * dashboard layout (sidebar + header) so the canvas gets every pixel.
 * Widgets and Layers/Inspector live as **floating panels** absolute-
 * positioned over the canvas; the user toggles them from the toolbar.
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │ ← Back   Visual Editor [Page▾]  [W][L] [📱] ↻ Code Save │  56px toolbar
 *   ├─────────────────────────────────────────────────────────┤
 *   │ ┌────────┐                              ┌────────┐      │
 *   │ │Widgets │       (iframe canvas)        │Inspector│      │  flex-1
 *   │ │palette │                              │for sect │      │
 *   │ └────────┘                              └────────┘      │
 *   └─────────────────────────────────────────────────────────┘
 *
 * Inspector auto-shows when a section is focused (via in-iframe click or
 * the Layers panel). Layers panel and Inspector both occupy the right
 * side; Inspector wins when both could show.
 *
 * Body scroll is locked while mounted so the dashboard underneath
 * doesn't peek through behind tall iframes.
 */
export default function VisualEditorPage() {
    const { showToast } = useNotification();
    const { has, isLoading: capsLoading } = useCapabilities();
    const router = useRouter();

    // ─── State ──────────────────────────────────────────────────────────
    const [pageSchema, setPageSchema] = useState<PageDef[]>([]);
    const [activePage, setActivePage] = useState<string>('home');
    const [sections, setSections] = useState<SectionState[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

    const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [iframeKey, setIframeKey] = useState(0);
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const railRef = useRef<HTMLDivElement | null>(null);
    const [themeConfigUrl, setThemeConfigUrl] = useState<string>('');

    const [catalog, setCatalog] = useState<WidgetCatalogItem[]>([]);
    const [catalogCategories, setCatalogCategories] = useState<
        { key: string; label: string; description?: string }[]
    >([]);
    const [proUnlocked, setProUnlocked] = useState(false);

    /** Floating panel visibility. Both default open is overwhelming on
        small screens, so Widgets defaults open and Layers stays closed
        until the user toggles it. The Inspector is implicit — driven by
        `activeSectionId`. */
    const [showWidgets, setShowWidgets] = useState(true);
    const [showLayers, setShowLayers] = useState(false);

    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    // ─── URL plumbing ───────────────────────────────────────────────────

    const themeUrl = useMemo(() => {
        if (typeof window === 'undefined') return '';
        return (
            (window as any).__THEME_URL__ ||
            process.env.NEXT_PUBLIC_THEME_URL ||
            themeConfigUrl ||
            (window.location.hostname === 'localhost' ? 'http://localhost:3002' : '')
        );
    }, [themeConfigUrl]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const cfg: any = await apiRequest('/themes/active/config');
                if (cancelled) return;
                if (cfg?.deployedUrl && typeof cfg.deployedUrl === 'string') {
                    setThemeConfigUrl(cfg.deployedUrl);
                }
            } catch {
                /* fallback chain handles it */
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const editSecret = useMemo(() => {
        if (typeof window === 'undefined') return 'cms';
        return process.env.NEXT_PUBLIC_REVALIDATE_SECRET || 'cms';
    }, []);

    const previewUrl = useMemo(() => {
        if (!themeUrl) return '';
        const slug = activePage && activePage !== 'home' ? `/${activePage}` : '/';
        return `${themeUrl}${slug}?editMode=${encodeURIComponent(editSecret)}`;
    }, [themeUrl, activePage, editSecret]);

    const deviceWidth =
        device === 'mobile' ? 390 : device === 'tablet' ? 820 : undefined;

    // ─── Back button ────────────────────────────────────────────────────

    /** Browser-history aware back. If the visual editor was opened
        directly (no history to go back to), fall through to the themes
        list as a sensible default. */
    const handleBack = useCallback(() => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            router.push('/dashboard/themes');
        }
    }, [router]);

    // ─── Body scroll lock ──────────────────────────────────────────────
    // Without this the dashboard layout under our `fixed inset-0` overlay
    // can scroll behind us when the canvas iframe is taller than the
    // viewport. Restore on unmount so navigating away returns to normal.
    useEffect(() => {
        if (typeof document === 'undefined') return;
        const original = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = original; };
    }, []);

    // ─── Load ───────────────────────────────────────────────────────────

    const load = useCallback(async () => {
        setIsLoading(true);
        try {
            const [schemaRes, pagesRes, catalogRes] = await Promise.all([
                apiRequest('/themes/active/page-schema'),
                apiRequest('/pages'),
                apiRequest('/themes/active/widget-catalog').catch(() => null),
            ]);
            const schema: PageDef[] = (schemaRes as any) ?? [];
            setPageSchema(schema);
            if (catalogRes) {
                const cat = catalogRes as WidgetCatalogResponse;
                setCatalog(cat.widgets || []);
                setCatalogCategories(cat.categories || []);
                setProUnlocked(!!cat.proUnlocked);
            }
            const active = schema.find((p) => p.slug === activePage) ?? schema[0];
            if (active) setActivePage(active.slug);
            const savedPage = ((pagesRes as any[]) ?? []).find(
                (p: any) => p.slug === (active?.slug ?? 'home'),
            );
            const savedSections: SectionState[] =
                savedPage?.data?.widgets ?? savedPage?.data?.sections ?? [];
            const seedFromSchema = (active?.sections ?? []).map((s) => {
                const existing = savedSections.find((x) => x.id === s.id);
                return existing ?? { id: s.id, type: s.type || s.id, enabled: true, data: {} };
            });
            const seededIds = new Set(seedFromSchema.map((s) => s.id));
            const extras = savedSections.filter((s) => !seededIds.has(s.id));
            setSections([...seedFromSchema, ...extras]);
        } catch (err: any) {
            showToast(err?.message ?? 'Failed to load page schema', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [activePage, showToast]);

    useEffect(() => {
        if (!capsLoading && has('visualThemeEditor')) load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [capsLoading, has]);

    // ─── Iframe bridge ─────────────────────────────────────────────────
    // Protocol matches `themes/<active>/src/components/EditorBridge.tsx`.

    useEffect(() => {
        const handler = (event: MessageEvent) => {
            const msg = event.data as any;
            if (!msg || typeof msg !== 'object') return;

            switch (msg.type) {
                case 'mero-editor:ready':
                    break;
                case 'mero-editor:section-click':
                case 'mero-editor:field-click':
                    if (msg.sectionId) {
                        setActiveSectionId(msg.sectionId);
                        // Make sure the Layers panel is open so the user
                        // sees their selection alongside the Inspector.
                        setShowLayers(true);
                        const card = railRef.current?.querySelector(
                            `[data-card-id="${CSS.escape(msg.sectionId)}"]`,
                        ) as HTMLElement | null;
                        card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        if (msg.type === 'mero-editor:field-click' && msg.fieldId) {
                            setTimeout(() => {
                                const fieldInput = railRef.current?.querySelector(
                                    `[data-field-key="${CSS.escape(msg.fieldId)}"] input, ` +
                                    `[data-field-key="${CSS.escape(msg.fieldId)}"] textarea`,
                                ) as HTMLElement | null;
                                fieldInput?.focus();
                            }, 100);
                        }
                    }
                    break;
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    const sendToIframe = (message: any) => {
        try { iframeRef.current?.contentWindow?.postMessage(message, '*'); } catch {}
    };

    // ─── Action handlers ───────────────────────────────────────────────

    const toggleSection = (id: string) => {
        setSections((prev) =>
            prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
        );
    };

    const addWidget = (item: WidgetCatalogItem) => {
        if (item.locked) {
            showToast(
                `${item.name} is a Pro widget — upgrade to Professional to use it.`,
                'info',
            );
            return;
        }
        const newId = makeInstanceId(item.type);
        setSections((prev) => [
            ...prev,
            { id: newId, type: item.type, enabled: true, data: {} },
        ]);
        setActiveSectionId(newId);
        setShowLayers(true); // open Layers so the user sees the new card
        // Same caveat as duplicateWidget — the iframe shows the saved
        // page, so a freshly-added widget doesn't appear in the preview
        // until Save. Spell that out in the toast so the user doesn't
        // think the add silently failed.
        showToast(`${item.name} added — click Save page to see it in the preview.`, 'success');
    };

    const removeWidget = (id: string) => {
        setSections((prev) => prev.filter((s) => s.id !== id));
        if (activeSectionId === id) setActiveSectionId(null);
    };

    const duplicateWidget = (id: string) => {
        let newId = '';
        setSections((prev) => {
            const idx = prev.findIndex((s) => s.id === id);
            if (idx < 0) return prev;
            const orig = prev[idx];
            // Deep-clone the data so editing the duplicate doesn't mutate
            // the original. JSON-clone is fine here — section data is
            // always JSON-serialisable (no Dates, no functions, no circular
            // refs) by the page-storage contract.
            newId = makeInstanceId(orig.type || orig.id);
            const copy: SectionState = {
                ...orig,
                id: newId,
                // The duplicate keeps the original's `type` so the renderer
                // and the catalog-fallback inspector both find the right
                // component. Without `type` set, the inspector can't open
                // because schemaById only has the original IDs.
                type: orig.type || schemaById.get(orig.id)?.type || orig.id,
                data: JSON.parse(JSON.stringify(orig.data || {})),
            };
            const next = [...prev];
            next.splice(idx + 1, 0, copy);
            return next;
        });
        // Open the inspector for the new copy so the user lands inside it
        // — matches the "added a thing → here it is" pattern in addWidget.
        if (newId) setActiveSectionId(newId);
        // The iframe shows the saved page, not local state. Without a
        // toast hint, users click duplicate and see the layers update but
        // nothing on the canvas — they think duplicate is broken. Spell
        // out the next step.
        showToast('Section duplicated. Click Save page to see it in the preview.', 'info');
    };

    const reorderTo = (dragId: string, overId: string | null) => {
        if (!dragId || dragId === overId) return;
        setSections((prev) => {
            const fromIdx = prev.findIndex((s) => s.id === dragId);
            if (fromIdx < 0) return prev;
            const next = [...prev];
            const [moved] = next.splice(fromIdx, 1);
            const toIdx = overId
                ? next.findIndex((s) => s.id === overId)
                : next.length;
            next.splice(toIdx >= 0 ? toIdx : next.length, 0, moved);
            return next;
        });
    };

    const save = async () => {
        const pageDef = pageSchema.find((p) => p.slug === activePage);
        if (!pageDef) return;
        setIsSaving(true);
        // Stamp `type` on every section before persisting. Sections seeded
        // from the legacy schema arrive with `type` set already; sections
        // dropped from the palette have it set on creation. Anything
        // missing one (legacy data freshly opened in the editor) gets the
        // schema-derived type so the renderer's id→type fallback is the
        // backstop, not the primary path. Without this stamping, the
        // theme logs "unknown widget type: hero" because the saved
        // section has only `id: 'hero'` and no `type`.
        const stamped: SectionState[] = sections.map((s) => {
            if (s.type) return s;
            const schemaEntry = schemaById.get(s.id);
            const inferredType = schemaEntry?.type || s.id;
            return { ...s, type: inferredType };
        });
        try {
            await apiRequest(`/pages/by-slug/${activePage}`, {
                method: 'PUT',
                body: {
                    title: pageDef.label,
                    status: 'PUBLISHED',
                    data: { widgets: stamped, sections: stamped },
                },
            });
            // Reflect the stamped types in local state so subsequent
            // edits + re-saves don't repeat the inference work.
            setSections(stamped);
            showToast('Page saved.', 'success');
            sendToIframe({ type: 'mero-editor:reload' });
            setIframeKey((k) => k + 1);
        } catch (err: any) {
            showToast(err?.message ?? 'Save failed', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const focusSection = (sectionId: string) => {
        setActiveSectionId(sectionId);
        sendToIframe({ type: 'mero-editor:highlight', sectionId });
    };

    const clearActiveSection = () => {
        setActiveSectionId(null);
        sendToIframe({ type: 'mero-editor:clear-highlights' });
    };

    useEffect(() => {
        if (!activePage) return;
        sendToIframe({ type: 'mero-editor:navigate', slug: activePage });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activePage]);

    const handleSectionEdit = (updated: EditorSectionData[]) => {
        if (!updated.length) return;
        const next = updated[0];
        setSections((prev) => {
            // Live in-iframe preview: for every text field whose value
            // changed since the last save, post a `mero-editor:field-update`
            // to the bridge so the iframe updates *immediately* without
            // a Save round-trip. The bridge mutates `data-editable`
            // elements in place via textContent, giving an instant
            // "I typed it, I see it" experience like Webflow's editor.
            //
            // Only fires for primitives (string / number / boolean) —
            // image fields and JSON arrays still need a Save + reload
            // because their downstream rendering can't be safely
            // mutated by string substitution alone.
            const previous = prev.find((s) => s.id === next.id);
            const oldData: Record<string, unknown> = (previous?.data as any) || {};
            const newData: Record<string, unknown> = (next.data as any) || {};
            const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
            for (const key of allKeys) {
                if (oldData[key] === newData[key]) continue;
                const v = newData[key];
                const isPrimitive =
                    v === null ||
                    typeof v === 'string' ||
                    typeof v === 'number' ||
                    typeof v === 'boolean';
                if (!isPrimitive) continue;
                sendToIframe({
                    type: 'mero-editor:field-update',
                    sectionId: next.id,
                    fieldId: key,
                    value: v == null ? '' : String(v),
                });
            }
            return prev.map((s) => (s.id === next.id ? next : s));
        });
    };

    // ─── Lookups ───────────────────────────────────────────────────────

    const activePageDef = pageSchema.find((p) => p.slug === activePage);
    const schemaById = useMemo(() => {
        const map = new Map<string, SectionDef>();
        pageSchema.forEach((p) => p.sections.forEach((s) => map.set(s.id, s)));
        return map;
    }, [pageSchema]);

    const catalogByType = useMemo(() => {
        const map = new Map<string, WidgetCatalogItem>();
        catalog.forEach((c) => map.set(c.type, c));
        return map;
    }, [catalog]);

    const paletteByCategory = useMemo(() => {
        const groups: { key: string; label: string; items: WidgetCatalogItem[] }[] = [];
        catalogCategories.forEach((cat) => {
            const items = catalog.filter((c) => c.category === cat.key);
            if (items.length) groups.push({ key: cat.key, label: cat.label, items });
        });
        const declared = new Set(catalogCategories.map((c) => c.key));
        const unsorted = catalog.filter((c) => !declared.has(c.category));
        if (unsorted.length) groups.push({ key: '_other', label: 'Other', items: unsorted });
        return groups;
    }, [catalog, catalogCategories]);

    const cardInfoFor = (s: SectionState) => {
        const schemaEntry = schemaById.get(s.id);
        const type = s.type || schemaEntry?.type || s.id;
        const catalogEntry = catalogByType.get(type);
        return {
            type,
            label: schemaEntry?.label || catalogEntry?.name || type,
            icon: iconFor(catalogEntry?.icon),
            premium: !!catalogEntry?.premium,
        };
    };

    // ─── Render ────────────────────────────────────────────────────────

    if (capsLoading) return null;

    if (!has('visualThemeEditor')) {
        return (
            <div className="max-w-3xl mx-auto py-8">
                <UpgradePrompt
                    feature="visualThemeEditor"
                    title="Visual Editor — edit your site the way you see it"
                    description="Click any section in the live preview to jump straight to its editor, swap component variants, and see the result instantly. Available on Professional and Enterprise plans."
                    minTier="Professional"
                />
            </div>
        );
    }

    // Resolve the active section's def for the Inspector. Schema wins;
    // catalog falls back for free-form widgets dropped from the palette.
    const activeState = activeSectionId
        ? sections.find((s) => s.id === activeSectionId) ?? null
        : null;
    const directSchema = activeSectionId ? schemaById.get(activeSectionId) ?? null : null;
    const catalogEntry = activeState?.type ? catalogByType.get(activeState.type) ?? null : null;
    const activeDef: SectionDef | null = directSchema
        ? directSchema
        : (activeState && catalogEntry)
            ? {
                  id: activeState.id,
                  type: catalogEntry.type,
                  label: catalogEntry.name,
                  fields: catalogEntry.fields as FieldDef[],
              }
            : null;
    const inInspector = !!(activeDef && activeState);

    return (
        <div className="fixed inset-0 z-[60] bg-slate-100 dark:bg-slate-950 flex flex-col overflow-hidden">
            {/* ─── Top toolbar ────────────────────────────────────────── */}
            <div className="h-14 flex items-center gap-3 px-4 border-b border-slate-200 dark:border-white/[0.06] bg-white dark:bg-slate-950 z-30 shrink-0">
                {/* Back */}
                <button
                    onClick={handleBack}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition"
                    title="Back"
                >
                    <ArrowLeftIcon className="w-4 h-4" /> Back
                </button>
                <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />
                <div className="flex items-center gap-2 min-w-0">
                    <CursorArrowRaysIcon className="w-4 h-4 text-blue-600 flex-none" />
                    <span className="font-bold text-sm text-slate-900 dark:text-white whitespace-nowrap">
                        Visual Editor
                    </span>
                    {pageSchema.length > 1 && (
                        <select
                            value={activePage}
                            onChange={(e) => setActivePage(e.target.value)}
                            className="text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 max-w-[160px]"
                        >
                            {pageSchema.map((p) => (
                                <option key={p.slug} value={p.slug}>{p.label}</option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="flex-1" />

                {/* Panel toggles */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 rounded-lg p-1">
                    <button
                        onClick={() => setShowWidgets((v) => !v)}
                        title={showWidgets ? 'Hide widgets panel' : 'Show widgets panel'}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                            showWidgets
                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                        <LucideSparkles className="w-3.5 h-3.5" /> Widgets
                    </button>
                    <button
                        onClick={() => setShowLayers((v) => !v)}
                        title={showLayers ? 'Hide layers panel' : 'Show layers panel'}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                            showLayers
                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                        <LucideLayers3 className="w-3.5 h-3.5" /> Layers
                        <span className="text-[10px] font-mono text-slate-400">{sections.length}</span>
                    </button>
                </div>

                {/* Device switcher */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 rounded-lg p-1">
                    {(['desktop', 'tablet', 'mobile'] as const).map((d) => {
                        const Icon =
                            d === 'mobile' ? DevicePhoneMobileIcon :
                            d === 'tablet' ? DeviceTabletIcon :
                            ComputerDesktopIcon;
                        return (
                            <button
                                key={d}
                                onClick={() => setDevice(d)}
                                title={d}
                                className={`p-1.5 rounded-md transition ${
                                    device === d
                                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                            </button>
                        );
                    })}
                </div>

                {/* Right-side actions */}
                <button
                    onClick={() => setIframeKey((k) => k + 1)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-white transition"
                    title="Reload preview"
                >
                    <ArrowPathIcon className="w-4 h-4" />
                </button>
                <Link
                    href={`/dashboard/site-pages`}
                    className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition"
                    title="Open in code editor"
                >
                    <PencilSquareIcon className="w-3.5 h-3.5" /> Code
                </Link>
                <button
                    onClick={save}
                    disabled={isSaving}
                    className="btn-destructive"
                >
                    {isSaving ? 'Saving…' : 'Save page'}
                </button>
            </div>

            {/* ─── WIDGETS strip — horizontal bar just below the toolbar.
                Widgets scroll horizontally so the canvas keeps its full
                vertical height. Categories label section dividers
                inline. ──────────────────────────────────────────── */}
            {showWidgets && (
                <div className="shrink-0 border-b border-slate-200 dark:border-white/[0.06] bg-white dark:bg-slate-900 z-20">
                    <div className="flex items-stretch gap-3 px-4 py-3 overflow-x-auto custom-scrollbar">
                        <div className="flex flex-col justify-center flex-none pr-2 border-r border-slate-100 dark:border-white/[0.06]">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Widgets
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {proUnlocked ? 'All unlocked' : 'Pro locked'}
                            </div>
                        </div>
                        {catalog.length === 0 ? (
                            <div className="text-[11px] text-slate-400 self-center">
                                No widgets in this theme. Add a{' '}
                                <code className="bg-slate-100 dark:bg-white/5 px-1 rounded">widgetCatalog</code>{' '}
                                to <code>theme.json</code>.
                            </div>
                        ) : (
                            paletteByCategory.map((group, gi) => (
                                <div key={group.key} className="flex items-stretch gap-2 flex-none">
                                    {gi > 0 && (
                                        <div className="self-center h-8 w-px bg-slate-200 dark:bg-white/10 mx-1" />
                                    )}
                                    <div className="flex flex-col justify-center pr-1">
                                        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                                            {group.label}
                                        </div>
                                    </div>
                                    {group.items.map((w) => {
                                        const Icon = iconFor(w.icon);
                                        return (
                                            <button
                                                key={w.type}
                                                onClick={() => addWidget(w)}
                                                title={w.description}
                                                className={`group relative w-20 flex-none px-2 py-2 rounded-xl border flex flex-col items-center gap-1 text-center transition ${
                                                    w.locked
                                                        ? 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900/40 text-slate-400 hover:border-amber-400'
                                                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10'
                                                }`}
                                            >
                                                <Icon
                                                    className={`w-4 h-4 ${
                                                        w.locked
                                                            ? 'text-slate-400'
                                                            : 'text-slate-600 dark:text-slate-300 group-hover:text-blue-600'
                                                    }`}
                                                />
                                                <span className="text-[10px] font-semibold leading-tight truncate w-full">
                                                    {w.name}
                                                </span>
                                                {w.locked && (
                                                    <LockClosedIcon className="absolute top-1 right-1 w-2.5 h-2.5 text-amber-500" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))
                        )}
                        {!proUnlocked && catalog.some((w) => w.locked) && (
                            <Link
                                href="/dashboard/settings/license"
                                className="flex-none flex flex-col justify-center px-3 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 hover:bg-amber-100 dark:hover:bg-amber-500/10 transition"
                                title="Upgrade for Pro widgets"
                            >
                                <div className="text-[9px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">
                                    Upgrade
                                </div>
                                <div className="text-[10px] text-amber-800 dark:text-amber-200">
                                    Unlock Pro widgets →
                                </div>
                            </Link>
                        )}
                        <div className="flex-1 min-w-2" />
                        <button
                            onClick={() => setShowWidgets(false)}
                            className="self-center flex-none p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-white transition"
                            title="Close widgets"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* ─── Canvas + Inspector drawer ─────────────────────────── */}
            <div className="flex-1 relative overflow-hidden bg-slate-100 dark:bg-slate-950">
                {/* Canvas — iframe centered, scrollable */}
                <div className="absolute inset-0 overflow-auto p-4 flex items-start justify-center">
                    {previewUrl ? (
                        <iframe
                            ref={iframeRef}
                            key={iframeKey}
                            src={previewUrl}
                            title="Theme preview"
                            style={{
                                width: deviceWidth ? `${deviceWidth}px` : '100%',
                                minHeight: 'calc(100% - 16px)',
                                height: 'calc(100% - 16px)',
                                border: '1px solid rgba(0,0,0,0.08)',
                                borderRadius: 12,
                                background: '#fff',
                                boxShadow: '0 12px 40px rgba(0,0,0,0.10)',
                            }}
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                        />
                    ) : (
                        <div className="self-center text-center text-sm text-slate-500 max-w-md mt-32">
                            <SparklesIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                            <p className="font-semibold mb-1">Preview unavailable</p>
                            <p className="text-xs">
                                Set <code className="bg-slate-200 dark:bg-white/10 px-1 rounded">NEXT_PUBLIC_THEME_URL</code> to your theme&rsquo;s
                                development URL (e.g. <code className="bg-slate-200 dark:bg-white/10 px-1 rounded">http://localhost:3002</code>).
                            </p>
                        </div>
                    )}
                </div>

                {/* Inspector — vertical drawer on the right when a section
                    is focused. Field editors are tall by nature so we keep
                    this one vertical even though Widgets and Layers are
                    horizontal strips. The drawer stays out of the way
                    until something is clicked. */}
                {inInspector && activeState && activeDef && (
                    <div
                        ref={railRef}
                        className="absolute top-4 right-4 w-80 max-h-[calc(100%-32px)] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-30"
                    >
                        <div className="px-3 py-3 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-1.5 shrink-0">
                            <button
                                onClick={clearActiveSection}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                                title="Close inspector"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    Editing
                                </div>
                                <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                    {activeDef.label ?? activeDef.id}
                                </div>
                            </div>
                            <button
                                onClick={() => toggleSection(activeState.id)}
                                title={activeState.enabled ? 'Hide section' : 'Show section'}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
                            >
                                {activeState.enabled ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => duplicateWidget(activeState.id)}
                                title="Duplicate section"
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
                            >
                                <DocumentDuplicateIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => {
                                    if (window.confirm(`Delete "${activeDef.label ?? activeDef.id}"? This won't be saved until you click Save page.`)) {
                                        removeWidget(activeState.id);
                                    }
                                }}
                                title="Delete section"
                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-600 transition"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <SectionEditor
                                schema={[activeDef as EditorSchemaSection]}
                                sections={[activeState as EditorSectionData]}
                                onChange={handleSectionEdit}
                            />
                            <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
                                Edits are kept locally — click <strong>Save page</strong> in the toolbar to publish.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── LAYERS strip — horizontal bar at the bottom. Each
                section is a card; cards reorder by dragging horizontally.
                Click a card to open the Inspector. ────────────────── */}
            {showLayers && (
                <div className="shrink-0 border-t border-slate-200 dark:border-white/[0.06] bg-white dark:bg-slate-900 z-20">
                    <div className="flex items-stretch gap-2 px-4 py-3 overflow-x-auto custom-scrollbar">
                        <div className="flex flex-col justify-center flex-none pr-2 border-r border-slate-100 dark:border-white/[0.06]">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Layers
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {activePageDef?.label ?? activePage} · {sections.length}
                            </div>
                        </div>
                        {isLoading ? (
                            <div className="self-center text-[11px] text-slate-400 px-2">Loading…</div>
                        ) : sections.length === 0 ? (
                            <div className="self-center text-[11px] text-slate-400 px-2">
                                Empty page. Open <strong>Widgets</strong> and add your first section.
                            </div>
                        ) : (
                            <div ref={railRef} className="flex items-stretch gap-2">
                                {sections.map((s) => {
                                    const info = cardInfoFor(s);
                                    const Icon = info.icon;
                                    const isActive = activeSectionId === s.id;
                                    const isDragging = draggingId === s.id;
                                    const isDragOver = dragOverId === s.id;
                                    return (
                                        <div
                                            key={s.id}
                                            data-card-id={s.id}
                                            draggable
                                            onDragStart={(e) => {
                                                setDraggingId(s.id);
                                                e.dataTransfer.effectAllowed = 'move';
                                                e.dataTransfer.setData('text/plain', s.id);
                                            }}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                e.dataTransfer.dropEffect = 'move';
                                                if (draggingId && draggingId !== s.id) setDragOverId(s.id);
                                            }}
                                            onDragLeave={() => {
                                                if (dragOverId === s.id) setDragOverId(null);
                                            }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                if (draggingId) reorderTo(draggingId, s.id);
                                                setDraggingId(null);
                                                setDragOverId(null);
                                            }}
                                            onDragEnd={() => {
                                                setDraggingId(null);
                                                setDragOverId(null);
                                            }}
                                            className={`group relative flex-none w-44 rounded-xl border transition ${
                                                isActive
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 ring-2 ring-blue-500/30'
                                                    : isDragOver
                                                        ? 'border-blue-300 bg-blue-50/50 dark:bg-blue-500/5'
                                                        : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-slate-900/40'
                                            } ${isDragging ? 'opacity-50' : ''}`}
                                        >
                                            <button
                                                onClick={() => focusSection(s.id)}
                                                className="w-full text-left px-3 py-2 flex items-center gap-2"
                                            >
                                                <span className="text-slate-300 dark:text-slate-600 cursor-grab active:cursor-grabbing flex-none" title="Drag to reorder">
                                                    <Bars3Icon className="w-3.5 h-3.5" />
                                                </span>
                                                <Icon className="w-3.5 h-3.5 flex-none text-slate-500 dark:text-slate-400" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate flex items-center gap-1">
                                                        {info.label}
                                                        {info.premium && !proUnlocked && (
                                                            <LockClosedIcon className="w-2.5 h-2.5 text-amber-500" />
                                                        )}
                                                    </div>
                                                    <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider truncate">
                                                        {info.type}
                                                    </div>
                                                </div>
                                            </button>
                                            <div className="absolute top-1 right-1 hidden group-hover:flex items-center gap-0.5 bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-100 dark:border-white/5">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleSection(s.id); }}
                                                    title={s.enabled ? 'Hide' : 'Show'}
                                                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
                                                >
                                                    {s.enabled ? <EyeIcon className="w-3 h-3" /> : <EyeSlashIcon className="w-3 h-3" />}
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); duplicateWidget(s.id); }}
                                                    title="Duplicate"
                                                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
                                                >
                                                    <DocumentDuplicateIcon className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm(`Delete "${info.label}"?`)) removeWidget(s.id);
                                                    }}
                                                    title="Delete"
                                                    className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-600 transition"
                                                >
                                                    <TrashIcon className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <div className="flex-1 min-w-2" />
                        <button
                            onClick={() => setShowLayers(false)}
                            className="self-center flex-none p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-white transition"
                            title="Close layers"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
