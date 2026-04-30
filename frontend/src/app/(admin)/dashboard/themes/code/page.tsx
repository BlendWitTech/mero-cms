'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    FolderIcon,
    FolderOpenIcon,
    DocumentIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    ArrowPathIcon,
    CheckIcon,
    ExclamationTriangleIcon,
    CodeBracketIcon,
    DocumentPlusIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { useCapabilities } from '@/context/CapabilitiesContext';
import UpgradePrompt from '@/components/ui/UpgradePrompt';

interface TreeNode {
    name: string;
    path: string;
    type: 'dir' | 'file';
    children?: TreeNode[];
    size?: number;
    editable?: boolean;
    language?: string;
}

interface OpenFile {
    path: string;
    content: string;
    originalContent: string;
    language: string;
    size: number;
}

const INDENT = '  '; // two spaces when Tab is pressed

// ─── File tree ──────────────────────────────────────────────────────────────

function FileTreeNode({
    node,
    depth,
    activePath,
    onOpen,
    onDelete,
    expandedDirs,
    onToggleDir,
}: {
    node: TreeNode;
    depth: number;
    activePath: string | null;
    onOpen: (path: string) => void;
    onDelete?: (path: string) => void;
    expandedDirs: Set<string>;
    onToggleDir: (path: string) => void;
}) {
    if (node.type === 'dir') {
        const isOpen = expandedDirs.has(node.path);
        return (
            <div>
                <button
                    type="button"
                    onClick={() => onToggleDir(node.path)}
                    className="flex items-center gap-1.5 w-full text-left px-2 py-1 rounded text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                    style={{ paddingLeft: depth * 12 + 8 }}
                >
                    {isOpen
                        ? <ChevronDownIcon className="w-3.5 h-3.5 flex-none text-slate-400" />
                        : <ChevronRightIcon className="w-3.5 h-3.5 flex-none text-slate-400" />}
                    {isOpen
                        ? <FolderOpenIcon className="w-4 h-4 flex-none text-amber-500" />
                        : <FolderIcon className="w-4 h-4 flex-none text-amber-500" />}
                    <span className="truncate">{node.name || '/'}</span>
                </button>
                {isOpen && node.children?.map((c) => (
                    <FileTreeNode
                        key={c.path}
                        node={c}
                        depth={depth + 1}
                        activePath={activePath}
                        onOpen={onOpen}
                        onDelete={onDelete}
                        expandedDirs={expandedDirs}
                        onToggleDir={onToggleDir}
                    />
                ))}
            </div>
        );
    }
    const isActive = node.path === activePath;
    return (
        <div
            className={`flex items-center gap-1.5 w-full pr-2 group rounded transition ${isActive ? 'bg-blue-50 dark:bg-blue-500/15' : 'hover:bg-slate-100 dark:hover:bg-white/5'}`}
        >
            <button
                type="button"
                onClick={() => node.editable && onOpen(node.path)}
                disabled={!node.editable}
                title={node.editable ? node.path : 'This file type cannot be edited'}
                className={`flex-1 flex items-center gap-1.5 text-left px-2 py-1 text-xs ${node.editable ? '' : 'opacity-40 cursor-not-allowed'} ${isActive ? 'font-semibold text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'}`}
                style={{ paddingLeft: depth * 12 + 8 + 14 }}
            >
                <DocumentIcon className="w-4 h-4 flex-none text-slate-400" />
                <span className="truncate">{node.name}</span>
            </button>
            {onDelete && node.editable && (
                <button
                    type="button"
                    onClick={() => onDelete(node.path)}
                    title="Delete file"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-red-600 transition"
                >
                    <TrashIcon className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}

// ─── Editor textarea ────────────────────────────────────────────────────────

function CodeTextarea({
    value,
    onChange,
    onSave,
    disabled,
}: {
    value: string;
    onChange: (v: string) => void;
    onSave: () => void;
    disabled?: boolean;
}) {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const [cursor, setCursor] = useState({ line: 1, col: 1 });

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const ta = e.currentTarget;

        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            onSave();
            return;
        }

        // Tab inserts two spaces (or indents selection)
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            if (start === end) {
                const next = value.slice(0, start) + INDENT + value.slice(end);
                onChange(next);
                requestAnimationFrame(() => {
                    ta.selectionStart = ta.selectionEnd = start + INDENT.length;
                });
            } else {
                // Indent each selected line
                const before = value.slice(0, start);
                const selection = value.slice(start, end);
                const after = value.slice(end);
                const indented = selection.replace(/^/gm, INDENT);
                const diff = indented.length - selection.length;
                onChange(before + indented + after);
                requestAnimationFrame(() => {
                    ta.selectionStart = start;
                    ta.selectionEnd = end + diff;
                });
            }
        }
    };

    const updateCursor = () => {
        const ta = textareaRef.current;
        if (!ta) return;
        const pos = ta.selectionStart;
        const before = value.slice(0, pos);
        const line = before.split('\n').length;
        const col = pos - before.lastIndexOf('\n');
        setCursor({ line, col });
    };

    // Line numbers — cheap, just count lines
    const lineCount = value.split('\n').length;
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 flex overflow-hidden rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 font-mono text-[13px] leading-[1.55]">
                <pre
                    aria-hidden
                    className="w-12 shrink-0 py-3 pr-2 text-right text-slate-400 dark:text-slate-600 select-none bg-slate-50 dark:bg-slate-900/40 border-r border-slate-100 dark:border-white/5 overflow-hidden"
                    style={{ fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit', tabSize: 2 as any }}
                >
                    {lineNumbers}
                </pre>
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onKeyUp={updateCursor}
                    onClick={updateCursor}
                    onSelect={updateCursor}
                    disabled={disabled}
                    spellCheck={false}
                    wrap="off"
                    className="flex-1 p-3 resize-none bg-transparent outline-none text-slate-900 dark:text-slate-100 overflow-auto"
                    style={{ tabSize: 2 as any, fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit' }}
                />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 px-1">
                <span>
                    Ln {cursor.line}, Col {cursor.col} · {lineCount} lines
                </span>
                <span className="font-mono">Ctrl/⌘ + S to save</span>
            </div>
        </div>
    );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function ThemeCodeEditorPage() {
    const { showToast } = useNotification();
    const { has, isLoading: capsLoading } = useCapabilities();

    const [tree, setTree] = useState<TreeNode | null>(null);
    const [loadingTree, setLoadingTree] = useState(true);
    const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['', 'src', 'src/app', 'src/components']));
    const [openFile, setOpenFile] = useState<OpenFile | null>(null);
    const [loadingFile, setLoadingFile] = useState(false);
    const [saving, setSaving] = useState(false);

    const isDirty = openFile ? openFile.content !== openFile.originalContent : false;

    // Warn before leaving with unsaved changes
    useEffect(() => {
        if (!isDirty) return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [isDirty]);

    const loadTree = useCallback(async () => {
        setLoadingTree(true);
        try {
            const t = await apiRequest('/theme-editor/tree', { skipNotification: true });
            setTree(t);
        } catch (err: any) {
            showToast(err?.message ?? 'Failed to load file tree.', 'error');
        } finally {
            setLoadingTree(false);
        }
    }, [showToast]);

    useEffect(() => {
        if (!capsLoading && has('themeCodeEdit')) loadTree();
    }, [capsLoading, has, loadTree]);

    const openFilePath = async (p: string) => {
        if (isDirty) {
            if (!confirm('You have unsaved changes. Discard them?')) return;
        }
        setLoadingFile(true);
        try {
            const f: any = await apiRequest(`/theme-editor/file?path=${encodeURIComponent(p)}`, {
                skipNotification: true,
            });
            setOpenFile({
                path: f.path,
                content: f.content,
                originalContent: f.content,
                language: f.language,
                size: f.size,
            });
        } catch (err: any) {
            showToast(err?.message ?? 'Failed to load file.', 'error');
        } finally {
            setLoadingFile(false);
        }
    };

    const save = async () => {
        if (!openFile) return;
        setSaving(true);
        try {
            await apiRequest('/theme-editor/file', {
                method: 'PUT',
                body: { path: openFile.path, content: openFile.content, revalidate: true },
            });
            setOpenFile((f) => (f ? { ...f, originalContent: f.content } : null));
            showToast('File saved. Theme cache revalidated.', 'success');
        } catch (err: any) {
            showToast(err?.message ?? 'Save failed.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const createFile = async () => {
        const relative = prompt(
            'New file path (relative to theme root). Example: src/components/New.tsx',
        );
        if (!relative) return;
        try {
            await apiRequest('/theme-editor/file', { method: 'POST', body: { path: relative, content: '' } });
            await loadTree();
            await openFilePath(relative);
            showToast(`Created ${relative}`, 'success');
        } catch (err: any) {
            showToast(err?.message ?? 'Failed to create file.', 'error');
        }
    };

    const deleteFile = async (p: string) => {
        if (!confirm(`Delete ${p}? This cannot be undone.`)) return;
        try {
            await apiRequest(`/theme-editor/file?path=${encodeURIComponent(p)}`, { method: 'DELETE' });
            await loadTree();
            if (openFile?.path === p) setOpenFile(null);
            showToast(`Deleted ${p}`, 'success');
        } catch (err: any) {
            showToast(err?.message ?? 'Delete failed.', 'error');
        }
    };

    const toggleDir = (p: string) => {
        setExpandedDirs((prev) => {
            const next = new Set(prev);
            if (next.has(p)) next.delete(p);
            else next.add(p);
            return next;
        });
    };

    // ─── Render ─────────────────────────────────────────────────────────────

    if (capsLoading) return null;

    if (!has('themeCodeEdit')) {
        return (
            <div className="max-w-3xl mx-auto py-8">
                <UpgradePrompt
                    feature="themeCodeEdit"
                    title="Edit your theme's source code"
                    description="Open, edit, and save any file in your active theme's source tree from the admin — the WordPress-style code editor experience. Available on Professional (Personal) and Enterprise (Organizational) plans."
                    minTier="Professional"
                />
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <CodeBracketIcon className="w-6 h-6 text-blue-600" />
                        Theme Code Editor
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Edit your active theme's source directly. Changes take effect on next save/revalidate.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadTree}
                        className="btn-outline flex items-center gap-1.5 px-3 py-2 text-xs"
                        title="Reload file tree"
                    >
                        <ArrowPathIcon className="w-4 h-4" /> Reload tree
                    </button>
                    <button
                        onClick={createFile}
                        className="btn-outline flex items-center gap-1.5 px-3 py-2 text-xs"
                    >
                        <DocumentPlusIcon className="w-4 h-4" /> New file
                    </button>
                    <button
                        onClick={save}
                        disabled={!openFile || !isDirty || saving}
                        className="btn-destructive"
                    >
                        {saving
                            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                            : <><CheckIcon className="w-4 h-4" /> {isDirty ? 'Save (Ctrl/⌘ S)' : 'Saved'}</>}
                    </button>
                </div>
            </div>

            {/* Caution banner */}
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 rounded-xl p-3 mb-4 text-xs">
                <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 flex-none mt-0.5" />
                <div className="text-amber-800 dark:text-amber-300">
                    Editing your theme's source changes live files on the server. We recommend committing
                    your theme to git and testing changes on a staging deployment before production saves.
                </div>
            </div>

            {/* Body: tree + editor */}
            <div className="flex gap-4 min-h-[560px]">
                {/* Tree */}
                <aside className="w-64 shrink-0 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-2 overflow-auto max-h-[calc(100vh-220px)]">
                    {loadingTree ? (
                        <div className="p-4 text-xs text-slate-400">Loading…</div>
                    ) : !tree ? (
                        <div className="p-4 text-xs text-slate-400">No tree available.</div>
                    ) : (
                        <FileTreeNode
                            node={tree}
                            depth={0}
                            activePath={openFile?.path ?? null}
                            onOpen={openFilePath}
                            onDelete={deleteFile}
                            expandedDirs={expandedDirs}
                            onToggleDir={toggleDir}
                        />
                    )}
                </aside>

                {/* Editor */}
                <section className="flex-1 flex flex-col min-w-0">
                    {loadingFile ? (
                        <div className="flex-1 grid place-items-center text-sm text-slate-400">Loading file…</div>
                    ) : !openFile ? (
                        <div className="flex-1 grid place-items-center text-center text-sm text-slate-400 bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                            <div>
                                <CodeBracketIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                <p>Select a file from the tree to start editing.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* File header */}
                            <div className="flex items-center justify-between mb-2 px-1">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-sm font-mono truncate text-slate-700 dark:text-slate-200">
                                        {openFile.path}
                                    </span>
                                    {isDirty && (
                                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300">
                                            Unsaved
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    {openFile.language}
                                </span>
                            </div>
                            <div className="flex-1 min-h-[500px]">
                                <CodeTextarea
                                    value={openFile.content}
                                    onChange={(content) => setOpenFile((f) => (f ? { ...f, content } : null))}
                                    onSave={save}
                                    disabled={saving}
                                />
                            </div>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}
