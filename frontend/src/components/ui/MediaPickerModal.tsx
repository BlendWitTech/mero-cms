'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, MagnifyingGlassIcon, PhotoIcon, ArrowUpTrayIcon, CheckIcon } from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';

interface MediaItem {
    id: string;
    url: string;
    filename: string;
    mimetype: string;
    altText?: string | null;
    size?: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    /** Single-select callback */
    onSelect: (url: string) => void;
    /** Multi-select callback — only used when multiple=true */
    onSelectMultiple?: (urls: string[]) => void;
    /** Allow selecting multiple images at once */
    multiple?: boolean;
    /** Currently selected URL (highlighted in grid) */
    current?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function absUrl(url: string) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

function humanSize(bytes?: number) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPickerModal({ isOpen, onClose, onSelect, onSelectMultiple, multiple = false, current }: Props) {
    const [items, setItems] = useState<MediaItem[]>([]);
    const [filtered, setFiltered] = useState<MediaItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');
    // Single-select
    const [selected, setSelected] = useState<MediaItem | null>(null);
    // Multi-select
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isUploading, setIsUploading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

    const load = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await apiRequest('/media');
            const list: MediaItem[] = Array.isArray(data) ? data : (data?.data ?? []);
            const images = list.filter(m => m.mimetype?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(m.filename || ''));
            setItems(images);
            setFiltered(images);
            if (current && !multiple) {
                const match = images.find(m => m.url === current || absUrl(m.url) === current);
                if (match) setSelected(match);
            }
        } catch { setItems([]); setFiltered([]); }
        finally { setIsLoading(false); }
    }, [current, multiple]);

    useEffect(() => {
        if (isOpen) {
            load();
            setSearch('');
            setSelected(null);
            setSelectedIds(new Set());
        }
    }, [isOpen, load]);

    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(q ? items.filter(m => (m.filename + (m.altText || '')).toLowerCase().includes(q)) : items);
    }, [search, items]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setIsUploading(true);
        try {
            const formData = new FormData();
            Array.from(files).forEach(f => formData.append('files', f));
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const res = await fetch(`${API_BASE}/media/upload`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formData,
            });
            if (res.ok) await load();
        } catch { }
        finally { setIsUploading(false); if (fileRef.current) fileRef.current.value = ''; }
    };

    const toggleMultiSelect = (item: MediaItem) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(item.id)) next.delete(item.id);
            else next.add(item.id);
            return next;
        });
    };

    const confirm = () => {
        if (multiple) {
            const urls = items.filter(m => selectedIds.has(m.id)).map(m => absUrl(m.url));
            if (urls.length === 0) return;
            onSelectMultiple?.(urls);
            onClose();
        } else {
            if (!selected) return;
            onSelect(absUrl(selected.url));
            onClose();
        }
    };

    const canConfirm = multiple ? selectedIds.size > 0 : !!selected;

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Media Library</h2>
                        <p className="text-xs text-slate-400 mt-0.5">{filtered.length} image{filtered.length !== 1 ? 's' : ''}{multiple ? ' · multi-select' : ''}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${isUploading ? 'bg-slate-100 text-slate-400 pointer-events-none' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20'}`}>
                            <ArrowUpTrayIcon className={`h-4 w-4 ${isUploading ? 'animate-bounce' : ''}`} />
                            {isUploading ? 'Uploading…' : 'Upload'}
                            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={isUploading} />
                        </label>
                        <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="px-6 py-3 border-b border-slate-50 shrink-0">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by filename…"
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-300 bg-slate-50"
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="aspect-square bg-slate-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <PhotoIcon className="h-16 w-16 text-slate-200 mb-4" />
                            <p className="text-sm font-bold text-slate-500">No images found</p>
                            <p className="text-xs text-slate-400 mt-1">Upload images using the button above</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {filtered.map(item => {
                                const isSelected = multiple ? selectedIds.has(item.id) : selected?.id === item.id;
                                const selectionIndex = multiple ? Array.from(selectedIds).indexOf(item.id) + 1 : 0;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => multiple ? toggleMultiSelect(item) : setSelected(isSelected ? null : item)}
                                        className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all focus:outline-none ${isSelected ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-transparent hover:border-slate-300'}`}
                                    >
                                        <img
                                            src={absUrl(item.url)}
                                            alt={item.altText || item.filename}
                                            className="w-full h-full object-cover"
                                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                        />
                                        {isSelected && (
                                            <div className="absolute inset-0 bg-blue-600/20 flex items-start justify-end p-1.5">
                                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg text-white text-[10px] font-black">
                                                    {multiple && selectionIndex > 0 ? selectionIndex : <CheckIcon className="h-3.5 w-3.5 stroke-[3]" />}
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-[10px] text-white font-medium truncate">{item.filename}</p>
                                            {item.size && <p className="text-[9px] text-white/70">{humanSize(item.size)}</p>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
                    <div className="text-xs text-slate-400">
                        {multiple ? (
                            selectedIds.size > 0
                                ? <span className="text-blue-600 font-semibold">{selectedIds.size} image{selectedIds.size !== 1 ? 's' : ''} selected</span>
                                : 'Click images to select (multiple allowed)'
                        ) : (
                            selected
                                ? <span className="text-slate-700 font-medium">Selected: <span className="font-mono">{selected.filename}</span></span>
                                : 'Click an image to select it'
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={confirm}
                            disabled={!canConfirm}
                            className="px-5 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-40 disabled:pointer-events-none"
                        >
                            {multiple ? `Add ${selectedIds.size > 0 ? selectedIds.size : ''} Image${selectedIds.size !== 1 ? 's' : ''}` : 'Use Image'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
