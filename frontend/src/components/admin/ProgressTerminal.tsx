'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Streaming "coding-style" terminal panel — generalized from the
 * setup wizard so admin Danger Zone (and future plugin/theme reinstall
 * actions) can reuse it.
 *
 * The panel opens an EventSource on `streamUrl` and renders each event
 * as a monospace line:
 *
 *   ⚪ pending   — known stage, not yet started
 *   ▸  working   — pulsing dot, animated
 *   ✓  done      — green check
 *   ✗  failed    — red x with error detail
 *
 * Why share with the wizard:
 *   First impressions in /setup and Danger Zone in /settings are doing
 *   the same job — make a long-running operation feel intentional and
 *   surface real errors instead of swallowing them under a spinner.
 *   Sharing the component keeps the visual language identical so a
 *   user who completed onboarding recognizes the panel later.
 *
 * The progress bus is shared too: the backend pushes to a single
 * SetupProgressService Subject regardless of whether the trigger was
 * the wizard's POST /setup/complete or an admin's POST /themes/reset.
 * That means any active terminal anywhere will see the events. In
 * practice only one runs at a time — both flows lock the UI behind a
 * confirmation modal.
 */

interface ProgressEvent {
    stage: string;
    status: 'started' | 'progress' | 'completed' | 'failed';
    message: string;
    detail?: string;
    timestamp: string;
}

interface Line extends ProgressEvent {
    /** Local id so React can key duplicate-stage events. */
    id: number;
}

interface ProgressTerminalProps {
    /** Full URL to the SSE endpoint, e.g. http://localhost:3001/setup/progress */
    streamUrl: string;
    /** Whether the SSE connection should be active. Caller toggles this when entering / leaving the operation. */
    active: boolean;
    /** Caption shown in the macOS-style title bar (e.g. "mero-cms › setup", "mero-cms › factory-reset"). */
    title?: string;
    /** Stage id whose `completed` event signals the operation is finished. Defaults to 'setup'. */
    completionStage?: string;
    /** Fired once the SSE channel is open. Caller waits for this before triggering the operation so no events are missed. */
    onConnected?: () => void;
    /** Bubble up "operation completed" so the caller can poll for restart / refresh / redirect. */
    onComplete?: () => void;
    /** Bubble up failure so the caller can show a retry CTA. */
    onFailed?: (event: ProgressEvent) => void;
}

const MAX_LINES = 200;

const STATUS_ICON: Record<ProgressEvent['status'], string> = {
    started: '▸',
    progress: '·',
    completed: '✓',
    failed: '✗',
};

const STATUS_CLASS: Record<ProgressEvent['status'], string> = {
    started: 'text-amber-300',
    progress: 'text-amber-300',
    completed: 'text-emerald-400',
    failed: 'text-red-400',
};

export default function ProgressTerminal({
    streamUrl,
    active,
    title = 'mero-cms › operation',
    completionStage = 'setup',
    onConnected,
    onComplete,
    onFailed,
}: ProgressTerminalProps) {
    const [lines, setLines] = useState<Line[]>([]);
    const [connected, setConnected] = useState(false);
    const counterRef = useRef(0);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!active) return;
        const es = new EventSource(streamUrl);

        es.onopen = () => {
            setConnected(true);
            onConnected?.();
        };
        es.onerror = () => setConnected(false);

        es.onmessage = (e) => {
            try {
                const ev: ProgressEvent = JSON.parse(e.data);
                counterRef.current += 1;
                const id = counterRef.current;
                setLines((prev) => {
                    const next = [...prev, { ...ev, id }];
                    return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next;
                });

                if (ev.stage === completionStage && ev.status === 'completed') {
                    onComplete?.();
                }
                if (ev.status === 'failed') {
                    onFailed?.(ev);
                }
            } catch {
                /* malformed payload — ignore. */
            }
        };

        return () => {
            es.close();
            setConnected(false);
        };
    }, [active, streamUrl, completionStage, onConnected, onComplete, onFailed]);

    // Auto-scroll to bottom on every new line.
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [lines]);

    return (
        <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl shadow-slate-900/50">
            {/* macOS-style traffic-light header */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border-b border-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                <span className="ml-3 text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest">
                    {title}
                </span>
                <span className={`ml-auto text-[10px] font-mono font-semibold ${connected ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {connected ? '● live' : '○ idle'}
                </span>
            </div>

            {/* Log body */}
            <div
                ref={containerRef}
                className="font-mono text-[11.5px] leading-relaxed text-slate-300 px-4 py-3 h-72 overflow-y-auto"
                style={{ scrollbarWidth: 'thin' }}
            >
                {lines.length === 0 && (
                    <div className="text-slate-500 italic">
                        Waiting for the server…
                    </div>
                )}

                {lines.map((line) => {
                    const time = line.timestamp ? new Date(line.timestamp) : new Date();
                    const ts = time.toTimeString().slice(0, 8);
                    return (
                        <div key={line.id} className="flex gap-3">
                            <span className="text-slate-600 select-none flex-shrink-0">{ts}</span>
                            <span className={`${STATUS_CLASS[line.status]} flex-shrink-0 font-bold`}>
                                {STATUS_ICON[line.status]}
                            </span>
                            <span className="text-slate-500 select-none flex-shrink-0 w-28 truncate">
                                {line.stage}
                            </span>
                            <span className={line.status === 'failed' ? 'text-red-300' : 'text-slate-200'}>
                                {line.message}
                                {line.detail && (
                                    <span className="block ml-0 mt-1 text-red-400/80 italic text-[11px] whitespace-pre-wrap">
                                        {line.detail.slice(0, 400)}
                                    </span>
                                )}
                            </span>
                        </div>
                    );
                })}

                {/* Blinking cursor while connected, hidden once the server's
                    final completion event arrives. */}
                {connected && (
                    <div className="flex gap-3 mt-1">
                        <span className="text-slate-600 select-none">&nbsp;</span>
                        <span className="text-emerald-400 animate-pulse">▌</span>
                    </div>
                )}
            </div>
        </div>
    );
}
