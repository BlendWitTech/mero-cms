'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ExclamationTriangleIcon, ArrowPathIcon, TrashIcon, FireIcon } from '@heroicons/react/24/outline';
import { apiRequest, getApiBaseUrl } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import ProgressTerminal from './ProgressTerminal';

/**
 * Settings → Danger Zone.
 *
 * Three actions, escalating in destructiveness:
 *
 *   1. Reinstall current theme
 *      → POST /themes/reinstall — re-imports seed content (and re-imports
 *        media if the theme bundles any). Keeps users, settings, and the
 *        theme choice. Non-destructive in the sense that it doesn't
 *        require a re-login. Useful when theme demo content drifts and
 *        you want to start over visually.
 *
 *   2. Reset content
 *      → POST /themes/reset (hardReset=false) — wipes pages, posts,
 *        menus, leads, media, etc. Keeps users, roles, system settings,
 *        and the active theme. Useful when handing the install over to
 *        a customer with their own content.
 *
 *   3. Factory reset
 *      → POST /themes/reset (hardReset=true) — wipes EVERYTHING except
 *        the system settings the wizard re-creates (cms_title etc.) and
 *        rolls SETUP_COMPLETE back to false in .env. The server
 *        restarts and the install reopens at /setup. This is the
 *        "give it to someone else from scratch" button.
 *
 * Each action streams progress through the shared SetupProgressService
 * (the same bus the first-boot wizard uses), so the embedded
 * ProgressTerminal renders live events as the backend works through
 * the steps. Failures land as a red line in the terminal AND show a
 * retry-friendly error banner.
 */

type ActionId = 'reinstall' | 'content-reset' | 'factory-reset';

interface ActionMeta {
    id: ActionId;
    title: string;
    description: string;
    confirmText: string;
    keepsUsers: boolean;
    triggers: () => Promise<unknown>;
    /** Stage id whose 'completed' event signals the operation is finished. */
    completionStage: string;
    /** Title shown in the terminal header. */
    terminalTitle: string;
    icon: typeof ArrowPathIcon;
    severity: 'warning' | 'danger' | 'critical';
}

export default function DangerZoneTab() {
    const { showToast } = useNotification();
    const apiBase = getApiBaseUrl();
    const searchParams = useSearchParams();

    const [activeAction, setActiveAction] = useState<ActionId | null>(null);
    const [confirmText, setConfirmText] = useState('');
    const [running, setRunning] = useState(false);
    const [error, setError] = useState('');

    // Deep-link support: theme cards (and other surfaces) can route here
    // with `?action=reinstall|content-reset|factory-reset` and we'll
    // expand that action's confirmation flow on mount. Saves a click
    // and makes the path from "I broke my content" → reset obvious.
    useEffect(() => {
        const fromUrl = searchParams?.get('action') as ActionId | null;
        if (fromUrl && ['reinstall', 'content-reset', 'factory-reset'].includes(fromUrl)) {
            setActiveAction(fromUrl);
        }
    }, [searchParams]);

    const actions: ActionMeta[] = [
        {
            id: 'reinstall',
            title: 'Reinstall current theme',
            description: 'Re-imports the active theme\'s seed content and demo media. Pages and posts you\'ve created get overwritten with the theme\'s defaults; users and system settings are kept.',
            confirmText: 'reinstall',
            keepsUsers: true,
            triggers: () => apiRequest('/themes/reinstall', { method: 'POST' }),
            completionStage: 'reinstall',
            terminalTitle: 'mero-cms › theme-reinstall',
            icon: ArrowPathIcon,
            severity: 'warning',
        },
        {
            id: 'content-reset',
            title: 'Reset content',
            description: 'Wipes all pages, posts, menus, leads, and media records. Users and roles stay, the active theme stays, system settings stay. Use this when handing the install over to a customer with their own content.',
            confirmText: 'reset content',
            keepsUsers: true,
            triggers: () => apiRequest('/themes/reset', {
                method: 'POST',
                body: JSON.stringify({ hardReset: false }),
                headers: { 'Content-Type': 'application/json' },
            }),
            completionStage: 'content-reset',
            terminalTitle: 'mero-cms › content-reset',
            icon: TrashIcon,
            severity: 'danger',
        },
        {
            id: 'factory-reset',
            title: 'Factory reset',
            description: 'Wipes EVERYTHING — content, settings, theme choice, and the setup-complete flag. The server will restart and reopen the setup wizard. Users and roles are removed too. Use this only if you\'re reinstalling from scratch.',
            confirmText: 'factory reset',
            keepsUsers: false,
            triggers: () => apiRequest('/themes/reset', {
                method: 'POST',
                body: JSON.stringify({ hardReset: true }),
                headers: { 'Content-Type': 'application/json' },
            }),
            completionStage: 'factory-reset',
            terminalTitle: 'mero-cms › factory-reset',
            icon: FireIcon,
            severity: 'critical',
        },
    ];

    const current = actions.find(a => a.id === activeAction);

    const handleStart = (id: ActionId) => {
        setActiveAction(id);
        setConfirmText('');
        setError('');
    };

    const handleCancel = () => {
        setActiveAction(null);
        setConfirmText('');
        setError('');
        setRunning(false);
    };

    /**
     * Two-step kick-off identical to the wizard pattern:
     *   1. Set running=true → ProgressTerminal mounts and opens SSE.
     *   2. ProgressTerminal calls onConnected → fireAction() POSTs the operation.
     *   3. Backend streams progress events.
     *   4. Final 'completed' event → onComplete → toast + redirect-or-refresh.
     */
    const handleConfirm = () => {
        if (!current) return;
        if (confirmText.trim().toLowerCase() !== current.confirmText) {
            setError(`Type "${current.confirmText}" exactly to confirm.`);
            return;
        }
        setError('');
        setRunning(true);
    };

    const fireAction = async () => {
        if (!current) return;
        try {
            await current.triggers();
            // Success path — terminal will surface the final 'completed'
            // event and call onComplete below.
        } catch (err: any) {
            setError(err?.message || 'Operation failed.');
            setRunning(false);
        }
    };

    const handleOperationComplete = () => {
        if (!current) return;
        showToast(`${current.title} complete.`, 'success');
        if (current.id === 'factory-reset') {
            // Server is restarting and SETUP_COMPLETE rolled back to
            // false. Send the user to /setup so they land on the wizard
            // when the backend comes back online.
            setTimeout(() => {
                window.location.href = '/setup';
            }, 2000);
        } else {
            // Refresh after a beat so the admin sees the empty / re-seeded
            // state without manually reloading.
            setTimeout(() => {
                window.location.reload();
            }, 2500);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-[3rem] p-6 sm:p-10 shadow-2xl shadow-slate-200 border border-red-200/50 relative overflow-hidden">
                {/* Red-tinted ambient background to signal the danger context */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none -z-0" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -z-0" />

                <div className="relative">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-red-500 rounded-2xl shadow-xl shadow-red-500/20 text-white">
                            <ExclamationTriangleIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 font-display">Danger Zone</h3>
                            <p className="text-xs text-slate-400 font-semibold mt-0.5">Destructive actions. Read each one carefully.</p>
                        </div>
                    </div>

                    {/* Action list — only renders when no operation is in flight.
                        Once running flips on, we swap the whole panel for the
                        terminal so the admin can't accidentally trigger a
                        second action mid-operation. */}
                    {!running && (
                        <div className="space-y-4">
                            {actions.map((action) => {
                                const Icon = action.icon;
                                const tone = action.severity === 'critical'
                                    ? 'border-red-200 bg-red-50/50'
                                    : action.severity === 'danger'
                                        ? 'border-orange-200 bg-orange-50/30'
                                        : 'border-amber-200 bg-amber-50/30';
                                const pillTone = action.severity === 'critical'
                                    ? 'bg-red-100 text-red-700'
                                    : action.severity === 'danger'
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'bg-amber-100 text-amber-700';
                                return (
                                    <div
                                        key={action.id}
                                        className={`p-5 rounded-2xl border-2 transition-all ${tone} ${activeAction === action.id ? 'ring-2 ring-red-300/50' : ''}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-700">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-sm font-bold text-slate-900">{action.title}</h4>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${pillTone}`}>
                                                        {action.severity}
                                                    </span>
                                                    {!action.keepsUsers && (
                                                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                                            Removes users
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-600 leading-relaxed">{action.description}</p>

                                                {activeAction === action.id ? (
                                                    <div className="mt-4 space-y-3">
                                                        <label className="block">
                                                            <span className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">
                                                                Type <code className="font-mono px-1 py-0.5 rounded bg-white border border-slate-200">{action.confirmText}</code> to confirm
                                                            </span>
                                                            <input
                                                                type="text"
                                                                value={confirmText}
                                                                onChange={(e) => setConfirmText(e.target.value)}
                                                                placeholder={action.confirmText}
                                                                autoComplete="off"
                                                                className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                                                            />
                                                        </label>
                                                        {error && (
                                                            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
                                                                {error}
                                                            </div>
                                                        )}
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={handleCancel}
                                                                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={handleConfirm}
                                                                disabled={confirmText.trim().toLowerCase() !== action.confirmText}
                                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-600/20"
                                                            >
                                                                Yes, {action.confirmText}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleStart(action.id)}
                                                        className="mt-3 px-4 py-2 bg-white border-2 border-slate-200 hover:border-red-400 hover:text-red-700 text-slate-700 font-bold text-xs rounded-xl transition-all"
                                                    >
                                                        {action.title}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Running state — terminal takes over the panel. */}
                    {running && current && (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-base font-bold text-slate-900">{current.title}</h4>
                                <p className="text-xs text-slate-500 mt-1">Live progress below. Don't close this tab — the operation is running on the server.</p>
                            </div>

                            <ProgressTerminal
                                streamUrl={`${apiBase}/setup/progress`}
                                active={running}
                                title={current.terminalTitle}
                                completionStage={current.completionStage}
                                onConnected={fireAction}
                                onComplete={handleOperationComplete}
                                onFailed={(ev) => {
                                    setError(ev.detail || ev.message || 'Operation failed.');
                                }}
                            />

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
                                    {error}
                                    <button
                                        onClick={handleCancel}
                                        className="ml-3 underline hover:no-underline"
                                    >
                                        Back to Danger Zone
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
