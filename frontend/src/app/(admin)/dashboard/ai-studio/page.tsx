'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Sparkles,
    Lock,
    PenLine,
    Search,
    Mail,
    HelpCircle,
    ShoppingBag,
    Image as ImageIcon,
    Copy,
    Check,
    RotateCcw,
    Wand2,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useCapabilities } from '@/context/CapabilitiesContext';
import { useNotification } from '@/context/NotificationContext';
import PageHeader from '@/components/ui/PageHeader';

interface AiPreset {
    key: string;
    label: string;
    description: string;
    promptHint: string;
    contextHint?: string;
    icon: string;
    category: 'writing' | 'seo' | 'commerce' | 'ops';
}

const ICON_MAP: Record<string, any> = {
    PenLine,
    Sparkles,
    Search,
    ImageIcon,
    Mail,
    HelpCircle,
    ShoppingBag,
};

const CATEGORY_LABEL: Record<AiPreset['category'], string> = {
    writing: 'Writing',
    seo: 'SEO',
    commerce: 'Commerce',
    ops: 'Operations',
};

export default function AiStudioPage() {
    const { limits, activePackage, isLoading: capsLoading } = useCapabilities();
    const { showToast } = useNotification();

    const [presets, setPresets] = useState<AiPreset[] | null>(null);
    const [selected, setSelected] = useState<AiPreset | null>(null);
    const [prompt, setPrompt] = useState('');
    const [context, setContext] = useState('');
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [history, setHistory] = useState<Array<{ preset: string; result: string; at: Date }>>([]);
    const [copied, setCopied] = useState(false);

    const canUseFeature = limits?.aiEnabled === true;

    useEffect(() => {
        if (capsLoading || !canUseFeature) return;
        apiRequest('/ai/templates', { skipNotification: true })
            .then((rows: AiPreset[]) => {
                setPresets(rows || []);
                if ((rows || []).length > 0) setSelected(rows[0]);
            })
            .catch(() => setPresets([]));
    }, [capsLoading, canUseFeature]);

    const handleGenerate = async () => {
        if (!selected) return;
        if (!prompt.trim()) {
            showToast('Write a prompt first.', 'error');
            return;
        }
        setGenerating(true);
        setResult(null);
        try {
            const res = await apiRequest('/ai/generate', {
                method: 'POST',
                skipNotification: true,
                body: {
                    preset: selected.key,
                    prompt: prompt.trim(),
                    context: context.trim(),
                },
            });
            const text: string = res?.text || '';
            setResult(text);
            setHistory(h =>
                [{ preset: selected.label, result: text, at: new Date() }, ...h].slice(0, 10),
            );
        } catch (err: any) {
            showToast(err?.message || 'Generation failed', 'error');
        } finally {
            setGenerating(false);
        }
    };

    const handleCopy = async () => {
        if (!result) return;
        try {
            await navigator.clipboard.writeText(result);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            showToast('Copy failed — select the text manually.', 'error');
        }
    };

    // ─── Upsell state ─────────────────────────────────────────────────────────
    if (!capsLoading && !canUseFeature) {
        return (
            <div className="space-y-6">
                <PageHeader title="AI" accent="Studio" subtitle="Generate content with curated AI presets." />
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
                                AI Content Studio
                            </h3>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                                Draft blog posts, polish page copy, generate SEO meta descriptions, write alt text,
                                spin up email subject lines, and more — all from one workspace.
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
            <PageHeader title="AI" accent="Studio" subtitle="Pick a preset, write a prompt, ship the output." />

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-5">
                {/* ─── Left: preset picker ─── */}
                <aside className="space-y-4">
                    {presets === null ? (
                        <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-6 animate-pulse text-xs text-slate-400">
                            Loading presets…
                        </div>
                    ) : (
                        (() => {
                            // Group by category
                            const byCategory = new Map<string, AiPreset[]>();
                            presets.forEach(p => {
                                const arr = byCategory.get(p.category) ?? [];
                                arr.push(p);
                                byCategory.set(p.category, arr);
                            });
                            return Array.from(byCategory.entries()).map(([cat, list]) => (
                                <div key={cat} className="space-y-2">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 px-1">
                                        {CATEGORY_LABEL[cat as AiPreset['category']]}
                                    </div>
                                    <div className="space-y-1.5">
                                        {list.map(p => {
                                            const Icon = ICON_MAP[p.icon] || Sparkles;
                                            const active = selected?.key === p.key;
                                            return (
                                                <button
                                                    key={p.key}
                                                    onClick={() => {
                                                        setSelected(p);
                                                        setResult(null);
                                                    }}
                                                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${active
                                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-500/30'
                                                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/[0.06] hover:border-slate-200 dark:hover:border-white/10'
                                                        }`}
                                                >
                                                    <div
                                                        className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${active
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                                            }`}
                                                    >
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className={`text-xs font-black ${active ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                                                            {p.label}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                                            {p.description}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ));
                        })()
                    )}
                </aside>

                {/* ─── Center: prompt + result ─── */}
                <main className="space-y-4">
                    {selected && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/[0.06] p-5 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900">
                                    <Wand2 className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900 dark:text-white">{selected.label}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{selected.description}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                                    {selected.promptHint}
                                </label>
                                <textarea
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/[0.07] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-y"
                                    placeholder="Your prompt…"
                                />
                            </div>

                            {selected.contextHint && (
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                                        {selected.contextHint}
                                    </label>
                                    <textarea
                                        value={context}
                                        onChange={e => setContext(e.target.value)}
                                        rows={4}
                                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/[0.07] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-y"
                                        placeholder="Extra context (optional)…"
                                    />
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={handleGenerate}
                                    disabled={generating || !prompt.trim()}
                                    className="btn-primary flex-1 py-2.5 text-sm gap-2"
                                >
                                    {generating ? (
                                        <RotateCcw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-4 h-4" />
                                    )}
                                    {generating ? 'Generating…' : 'Generate'}
                                </button>
                                {result && (
                                    <button
                                        onClick={() => {
                                            setResult(null);
                                            setPrompt('');
                                            setContext('');
                                        }}
                                        className="btn-outline px-4 py-2.5 text-sm"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {result && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/[0.06] p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                    Result
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            <pre className="text-sm whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-300 leading-relaxed">
                                {result}
                            </pre>
                        </div>
                    )}
                </main>

                {/* ─── Right: recent history ─── */}
                <aside className="space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 px-1">
                        Recent
                    </div>
                    {history.length === 0 && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 px-1 italic">
                            Your session history will appear here.
                        </p>
                    )}
                    {history.map((h, i) => (
                        <button
                            key={i}
                            onClick={() => setResult(h.result)}
                            className="w-full text-left p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/[0.06] hover:border-slate-200 dark:hover:border-white/10 transition-colors"
                        >
                            <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                {h.preset}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                                {h.result}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                                {h.at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </button>
                    ))}
                </aside>
            </div>
        </div>
    );
}
