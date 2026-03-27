'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useDropzone } from 'react-dropzone';
import {
    XMarkIcon,
    CloudArrowUpIcon,
    PhotoIcon,
    TrashIcon,
    CheckCircleIcon,
    DocumentIcon,
    ArrowDownTrayIcon,
    ClipboardDocumentIcon,
    FolderIcon,
    MagnifyingGlassIcon,
    VideoCameraIcon,
    CheckIcon,
} from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import AlertDialog from '@/components/ui/AlertDialog';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
import UnsavedChangesAlert from '@/components/ui/UnsavedChangesAlert';
import { useNotification } from '@/context/NotificationContext';
import PermissionGuard from '@/components/auth/PermissionGuard';

interface MediaItem {
    id: string;
    filename: string;
    url: string;
    mimetype: string;
    size: number;
    width?: number;
    height?: number;
    altText?: string;
    folder: string;
    metadata?: any;
    createdAt: string;
}

interface MediaLibraryProps {
    isOpen?: boolean;
    onClose?: () => void;
    onSelect?: (url: string) => void;
    isStandalone?: boolean;
}

export default function MediaLibrary({
    isOpen = true,
    onClose = () => { },
    onSelect = () => { },
    isStandalone = false
}: MediaLibraryProps) {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'images' | 'videos' | 'docs'>('all');
    const [editAlt, setEditAlt] = useState('');
    const [isSavingAlt, setIsSavingAlt] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<{ url: string, size: string | null }>({ url: '', size: null });
    const [textContent, setTextContent] = useState<string | null>(null);
    const { showToast } = useNotification();

    // Alert State
    const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    // Generic Alert State (Delete, Info, etc.)
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        variant: 'danger' | 'info';
        confirmLabel: string;
        cancelLabel?: string;
        onConfirm: () => void;
        onCancel?: () => void;
    }>({
        isOpen: false,
        title: '',
        description: '',
        variant: 'info',
        confirmLabel: 'Confirm',
        onConfirm: () => { },
    });

    // ...



    // ...



    useEffect(() => {
        if (isOpen || isStandalone) {
            fetchMedia();
        }
    }, [isOpen, isStandalone]);

    useEffect(() => {
        console.log('[showUnsavedAlert state changed]', showUnsavedAlert);
    }, [showUnsavedAlert]);

    const fetchMedia = async () => {
        setIsLoading(true);
        try {
            const data = await apiRequest('/media');
            setMedia(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch media', error);
        } finally {
            setIsLoading(false);
        }
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setIsUploading(true);
        const formData = new FormData();
        acceptedFiles.forEach(file => formData.append('files', file));

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/media/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                const newItems = await response.json();
                setMedia(prev => [...newItems, ...prev]);
                if (newItems.length > 0) setSelectedId(newItems[0].id);
                showToast('Files uploaded successfully', 'success');
            } else {
                showToast('Upload failed', 'error');
            }
        } catch (error) {
            console.error('Upload failed', error);
            showToast('Upload failed', 'error');
        } finally {
            setIsUploading(false);
        }
    }, [media, showToast]);

    const getAcceptConfig = () => {
        const config: { [key: string]: string[] } = {};

        if (activeTab === 'images') {
            config['image/*'] = ['.jpeg', '.jpg', '.png', '.webp', '.gif'];
        } else if (activeTab === 'videos') {
            config['video/*'] = ['.mp4', '.webm'];
        } else if (activeTab === 'docs') {
            config['application/pdf'] = ['.pdf'];
            config['text/plain'] = ['.txt'];
            config['application/msword'] = ['.doc'];
            config['application/vnd.openxmlformats-officedocument.wordprocessingml.document'] = ['.docx'];
            config['application/vnd.ms-excel'] = ['.xls'];
            config['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] = ['.xlsx'];
            config['model/gltf-binary'] = ['.glb'];
            config['model/gltf+json'] = ['.gltf'];
        } else {
            // All
            config['image/*'] = ['.jpeg', '.jpg', '.png', '.webp', '.gif'];
            config['video/*'] = ['.mp4', '.webm'];
            config['application/pdf'] = ['.pdf'];
            config['text/plain'] = ['.txt'];
            config['application/msword'] = ['.doc'];
            config['application/vnd.openxmlformats-officedocument.wordprocessingml.document'] = ['.docx'];
            config['application/vnd.ms-excel'] = ['.xls'];
            config['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] = ['.xlsx'];
            config['model/gltf-binary'] = ['.glb'];
            config['model/gltf+json'] = ['.gltf'];
        }
        return config;
    };

    const acceptString = (() => {
        if (activeTab === 'images') return "image/*";
        if (activeTab === 'videos') return "video/*";
        if (activeTab === 'docs') return ".pdf,.doc,.docx,.txt,.xls,.xlsx,.glb,.gltf";
        return "image/*,video/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.glb,.gltf";
    })();

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: getAcceptConfig(),
        noClick: true, // Let label handle click
    });

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setAlertConfig({
            isOpen: true,
            title: 'Delete Asset?',
            description: 'This action cannot be undone. This asset will be permanently removed from your library and any posts employing it may break.',
            variant: 'danger',
            confirmLabel: 'Delete Permanently',
            onConfirm: () => confirmDelete(id),
        });
    };

    const confirmDelete = async (id: string) => {
        try {
            await apiRequest(`/media/${id}`, { method: 'DELETE' });
            setMedia(media.filter(m => m.id !== id));
            if (selectedId === id) setSelectedId(null);
            closeAlert();
            showToast('Asset deleted successfully', 'success');
        } catch (error) {
            console.error('Delete failed', error);
            showToast('Failed to delete asset', 'error');
        }
    };

    const closeAlert = () => {
        setAlertConfig(prev => ({ ...prev, isOpen: false }));
    };

    const handleUpdateAlt = async () => {
        if (!selectedId) return;
        setIsSavingAlt(true);
        try {
            const finalAlt = editAlt.trim() || beautifyFilename(media.find(m => m.id === selectedId)?.filename || '');
            await apiRequest(`/media/${selectedId}`, {
                method: 'PATCH',
                body: { altText: finalAlt }
            });
            setMedia(media.map(m => m.id === selectedId ? { ...m, altText: finalAlt } : m));
            setEditAlt(finalAlt);
            showToast('Alt text updated', 'success');
        } catch (error) {
            console.error('Update failed', error);
            showToast('Failed to update alt text', 'error');
        } finally {
            setIsSavingAlt(false);
        }
    };

    const beautifyFilename = (filename: string) => {
        return filename
            .split('.')
            .slice(0, -1)
            .join('.')
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    };

    useEffect(() => {
        const item = media.find(m => m.id === selectedId);
        if (item) {
            setEditAlt(item.altText || '');
            setSelectedVersion({ url: `${API_BASE}${item.url}`, size: 'Original' });

            if (item.mimetype === 'text/plain') {
                fetch(`${API_BASE}${item.url}`)
                    .then(r => r.text())
                    .then(t => setTextContent(t.slice(0, 10000))) // Load first 10KB
                    .catch(() => setTextContent('Error loading preview.'));
            } else {
                setTextContent(null);
            }
        } else {
            setEditAlt('');
            setTextContent(null);
            setSelectedVersion({ url: '', size: null });
        }
    }, [selectedId, media]);

    const handleVersionSelect = (url: string, size: string) => {
        setSelectedVersion({ url, size });
    };

    const handleInsertClick = () => {
        if (!selectedId) return;
        const item = media.find(m => m.id === selectedId);
        if (!item) return;

        // Check 1: Missing Alt Text
        const currentAlt = editAlt.trim() || item.altText?.trim();

        if (!currentAlt) {
            setAlertConfig({
                isOpen: true,
                title: 'Missing Alt Text',
                description: 'Search engines rely on Alt Text to understand images. Would you like to auto-generate a description from the filename before inserting?',
                variant: 'info',
                confirmLabel: 'Auto-Generate & Insert',
                cancelLabel: 'Insert Anyway',
                onConfirm: async () => {
                    const newAlt = beautifyFilename(item.filename);
                    try {
                        await apiRequest(`/media/${item.id}`, {
                            method: 'PATCH',
                            body: { altText: newAlt }
                        });
                        setEditAlt(newAlt);
                        validateOptimization(newAlt);
                    } catch (e) {
                        console.error(e);
                        validateOptimization(null);
                    }
                    closeAlert();
                },
                onCancel: () => {
                    closeAlert();
                    validateOptimization(null);
                }
            });
            return;
        }

        validateOptimization(currentAlt);
    };

    const validateOptimization = (confirmedAlt: string | null) => {
        const item = media.find(m => m.id === selectedId);
        if (!item) return;

        // Check 2: Optimization
        const isOriginal = selectedVersion.url.includes(item.url);
        const hasBetter = item.metadata?.versions?.medium;

        if (isOriginal && hasBetter && selectedVersion.url !== `${API_BASE}${hasBetter}`) {
            setAlertConfig({
                isOpen: true,
                title: 'Better Version Available',
                description: `You selected the Original asset. The Medium WebP version is significantly smaller and loads faster. Use that instead?`,
                variant: 'info',
                confirmLabel: 'Use Optimized (Recommended)',
                cancelLabel: 'Use Original',
                onConfirm: () => {
                    onSelect(`${API_BASE}${hasBetter}`);
                    closeAlert();
                },
                onCancel: () => {
                    onSelect(selectedVersion.url);
                    closeAlert();
                }
            });
            return;
        }

        onSelect(selectedVersion.url);
    };

    const handleDiscard = () => {
        if (pendingAction) pendingAction();
        setShowUnsavedAlert(false);
        setPendingAction(null);
    };

    const handleSaveAndExit = async () => {
        await handleUpdateAlt();
        if (pendingAction) pendingAction();
        setShowUnsavedAlert(false);
        setPendingAction(null);
    };

    // Dirty Check Logic
    const isDirty = () => {
        if (!selectedId) return false;
        const item = media.find(m => m.id === selectedId);
        if (!item) return false;
        const current = editAlt.trim();
        const original = item.altText?.trim() || '';
        const dirty = current !== original;
        console.log('[isDirty]', { current, original, dirty, selectedId });
        return dirty;
    };

    const handleSelectionChange = (newId: string | null) => {
        console.log('[handleSelectionChange]', { newId, selectedId, isDirty: isDirty() });
        if (selectedId && isDirty()) {
            console.log('[handleSelectionChange] Showing unsaved alert');
            setPendingAction(() => () => setSelectedId(newId));
            setShowUnsavedAlert(true);
        } else {
            console.log('[handleSelectionChange] No unsaved changes, selecting directly');
            setSelectedId(newId);
        }
    };

    const handleCloseWrapper = () => {
        if (selectedId && isDirty()) {
            setPendingAction(() => () => onClose());
            setShowUnsavedAlert(true);
        } else {
            onClose();
        }
    };

    // Handle ESC key to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !isStandalone) handleCloseWrapper();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, isStandalone, onClose, selectedId, editAlt, media]);

    if (!isOpen && !isStandalone) return null;

    const filteredMedia = media.filter(item => {
        const matchesSearch = item.filename.toLowerCase().includes(searchQuery.toLowerCase());
        const isImage = item.mimetype.startsWith('image/');
        const isVideo = item.mimetype.startsWith('video/');

        const matchesTab = activeTab === 'all'
            || (activeTab === 'images' && isImage)
            || (activeTab === 'videos' && isVideo)
            || (activeTab === 'docs' && !isImage && !isVideo);

        return matchesSearch && matchesTab;
    });

    const genericAlert = (
        <AlertDialog
            isOpen={alertConfig.isOpen}
            title={alertConfig.title}
            description={alertConfig.description}
            variant={alertConfig.variant}
            confirmLabel={alertConfig.confirmLabel}
            onConfirm={alertConfig.onConfirm}
            onCancel={alertConfig.onCancel || closeAlert}
            cancelLabel={alertConfig.cancelLabel || 'Cancel'}
        />
    );

    console.log('[Rendering unsavedChangesAlert]', { showUnsavedAlert, isSavingAlt });
    const unsavedChangesAlert = (
        <UnsavedChangesAlert
            isOpen={showUnsavedAlert}
            onSaveAndExit={handleSaveAndExit}
            onDiscardAndExit={handleDiscard}
            onCancel={() => setShowUnsavedAlert(false)}
            isSaving={isSavingAlt}
        />
    );

    const selectedMedia = media.find(m => m.id === selectedId);

    const content = (
        <div className={isStandalone ? "w-full h-full flex flex-col" : "w-full h-full flex flex-col"}>
            {/* Header Section */}
            <div className="flex-shrink-0 px-8 pb-6 pt-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
                            Media <span className="text-blue-600 font-bold">Library</span>
                        </h1>
                        <p className="mt-1 text-xs text-slate-500 font-semibold tracking-tight">Manage your digital assets and files.</p>
                    </div>
                    {!isStandalone && (
                        <button onClick={handleCloseWrapper} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-colors">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    )}
                </div>
            </div>

            {/* Toolbar Row */}
            <div className="flex-shrink-0 px-8 py-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-200 bg-white/50 backdrop-blur-sm z-10 sticky top-0">
                <div className="relative group w-full">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search assets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-100/50 rounded-[2rem] border border-slate-200 backdrop-blur-sm">
                    {[
                        { id: 'all', label: 'All', icon: FolderIcon },
                        { id: 'images', label: 'Images', icon: PhotoIcon },
                        { id: 'videos', label: 'Videos', icon: VideoCameraIcon },
                        { id: 'docs', label: 'Docs', icon: DocumentIcon },
                    ].map((tab: any) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-2 py-3 rounded-[1.75rem] text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab.id
                                ? 'bg-white text-blue-600 shadow-xl shadow-slate-200 ring-1 ring-slate-200/50'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            <span className="hidden lg:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Content Area - Grid */}
                <div className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden relative min-w-0" {...getRootProps()}>
                    <input {...getInputProps()} />

                    {isDragActive && (
                        <div className="absolute inset-0 z-50 bg-blue-600/95 backdrop-blur-md flex flex-col items-center justify-center text-white">
                            <CloudArrowUpIcon className="h-24 w-24 mb-6 animate-bounce" />
                            <h3 className="text-3xl font-black font-display tracking-tight">Drop files here</h3>
                            <p className="mt-2 text-blue-200 font-medium">to upload instantly</p>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto custom-scrollbar pt-6 px-8">
                        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                            {/* Upload Card */}
                            <PermissionGuard permission="media_upload">
                                <label className="aspect-square bg-white rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600 transition-all cursor-pointer group relative overflow-hidden shadow-sm hover:shadow-md">
                                    <input type="file" className="hidden" multiple onChange={(e) => onDrop(Array.from(e.target.files || []))} disabled={isUploading} accept={acceptString} />
                                    {isUploading ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent"></div>
                                            <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Uploading...</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 group-hover:scale-110 transition-transform">
                                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <CloudArrowUpIcon className="h-6 w-6" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest">Add New</span>
                                        </div>
                                    )}
                                </label>
                            </PermissionGuard>

                            {filteredMedia.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleSelectionChange(item.id)}
                                    className="group relative cursor-pointer"
                                >
                                    <div className={`aspect-square rounded-2xl overflow-hidden bg-white relative transition-all duration-300 shadow-sm ${selectedId === item.id
                                        ? 'ring-4 ring-blue-500/30 border-blue-500 scale-[1.02] shadow-xl z-10'
                                        : 'hover:scale-[1.02] hover:shadow-lg border border-slate-200'
                                        }`}>

                                        {item.mimetype.startsWith('image/') || (item.mimetype.startsWith('video/') && item.metadata?.poster) ? (
                                            <div className="w-full h-full relative">
                                                <img
                                                    src={`${API_BASE}${item.mimetype.startsWith('video/') ? item.metadata.poster : ((item.metadata?.versions?.small) || item.url)}`}
                                                    alt={item.altText || item.filename}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                                {item.mimetype.startsWith('video/') && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                                                        <div className="h-10 w-10 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white shadow-lg ring-1 ring-white/50">
                                                            <VideoCameraIcon className="h-5 w-5 ml-0.5" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                                                <DocumentIcon className="h-12 w-12 mb-3 opacity-50" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{item.mimetype.split('/')[1]}</span>
                                            </div>
                                        )}

                                        {selectedId === item.id && (
                                            <div className="absolute inset-0 bg-blue-900/10 flex items-center justify-center backdrop-blur-[1px]">
                                                <div className="bg-blue-600 text-white rounded-full p-2 shadow-lg scale-in-center animate-in fade-in zoom-in duration-200">
                                                    <CheckCircleIcon className="h-6 w-6" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <p className={`mt-2.5 text-xs font-bold truncate px-1 transition-colors text-center ${selectedId === item.id ? 'text-blue-600' : 'text-slate-600 group-hover:text-slate-900'
                                        }`}>
                                        {item.filename}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {filteredMedia.length === 0 && !isLoading && (
                            <div className="h-[50vh] flex flex-col items-center justify-center text-slate-400">
                                <div className="p-6 bg-white rounded-full shadow-sm mb-4">
                                    <PhotoIcon className="h-12 w-12 opacity-30" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">No assets found</h3>
                                <p className="text-sm font-medium mt-1">Try adjusting your search or upload new files.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Details Sidebar */}
                {selectedMedia && (
                    <div className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-2xl relative z-20 flex-shrink-0 h-full overflow-hidden">
                        {/* Header Fixed */}
                        <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-white z-10">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Asset Details</h3>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleUpdateAlt}
                                    disabled={!isDirty() || isSavingAlt}
                                    className="p-1.5 text-blue-600 rounded-lg hover:bg-blue-50 hover:text-blue-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                    title="Save Changes"
                                >
                                    {isSavingAlt ? <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" /> : <CheckIcon className="h-5 w-5" />}
                                </button>
                                <button onClick={() => handleSelectionChange(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content Container (Flexible) */}
                        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-4 gap-4">

                            {/* Preview (Flexible Height with Min Height) */}
                            <div className="flex-shrink-0 min-h-[200px] w-full bg-slate-100 rounded-2xl overflow-hidden relative group shadow-inner ring-1 ring-black/5 aspect-video">
                                {selectedMedia.mimetype.startsWith('video/') ? (
                                    <video
                                        src={`${API_BASE}${selectedMedia.url}`}
                                        controls
                                        className="w-full h-full object-contain bg-black"
                                        poster={selectedMedia.metadata?.poster ? `${API_BASE}${selectedMedia.metadata.poster}` : undefined}
                                    />
                                ) : selectedMedia.mimetype.startsWith('image/') ? (
                                    <div className="w-full h-full relative pattern-grid">
                                        <img
                                            src={`${API_BASE}${selectedMedia.url}`}
                                            alt=""
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                ) : selectedMedia.mimetype === 'application/pdf' ? (
                                    <iframe
                                        src={`${API_BASE}${selectedMedia.url}#toolbar=0`}
                                        className="w-full h-full bg-white"
                                        title={selectedMedia.filename}
                                    />
                                ) : selectedMedia.mimetype === 'text/plain' && textContent ? (
                                    <div className="w-full h-full bg-white p-4 overflow-auto custom-scrollbar">
                                        <pre className="text-[10px] font-mono text-slate-600 whitespace-pre-wrap leading-relaxed">
                                            {textContent}
                                        </pre>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                                        <div className="p-6 bg-white rounded-3xl shadow-sm mb-4">
                                            {selectedMedia.mimetype.includes('pdf') ? <DocumentIcon className="h-10 w-10 text-red-100 text-red-500" /> :
                                                selectedMedia.mimetype.includes('word') || selectedMedia.mimetype.includes('doc') ? <DocumentIcon className="h-10 w-10 text-blue-100 text-blue-500" /> :
                                                    selectedMedia.mimetype.includes('excel') || selectedMedia.mimetype.includes('sheet') ? <DocumentIcon className="h-10 w-10 text-green-100 text-green-500" /> :
                                                        <DocumentIcon className="h-10 w-10 text-slate-100" />}
                                        </div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Preview Not Available</p>
                                        <p className="text-[10px] font-medium text-slate-300 mt-1 uppercase tracking-widest">
                                            {selectedMedia.mimetype.includes('word') || selectedMedia.mimetype.includes('doc') ? 'WORD DOCUMENT' :
                                                selectedMedia.mimetype.includes('excel') || selectedMedia.mimetype.includes('sheet') ? 'EXCEL SPREADSHEET' :
                                                    selectedMedia.mimetype.split('/')[1].toUpperCase()}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-shrink-0">
                                <h2 className="text-xl font-black text-slate-900 break-words leading-tight font-display">{selectedMedia.filename}</h2>
                                <div className="flex flex-wrap items-center gap-3 mt-4">
                                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wide border border-slate-200">
                                        {(selectedMedia.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                    <span className="px-2.5 py-1 rounded-md bg-blue-50 text-[10px] font-bold text-blue-600 uppercase tracking-wide border border-blue-100">
                                        {selectedMedia.mimetype.split('/')[1].toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex-shrink-0 grid grid-cols-2 gap-3">
                                <a
                                    href={`${API_BASE}${selectedMedia.url}`}
                                    target="_blank"
                                    className="flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all hover:-translate-y-0.5"
                                >
                                    <ArrowDownTrayIcon className="h-4 w-4" />
                                    Download
                                </a>
                                <PermissionGuard permission="media_delete" behavior="hide">
                                    <button
                                        onClick={(e) => handleDeleteClick(selectedMedia.id, e)}
                                        className="flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all hover:-translate-y-0.5"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                        Delete
                                    </button>
                                </PermissionGuard>
                            </div>

                            <hr className="border-slate-100 my-2" />

                            {/* Version Selection */}
                            {!isStandalone && (
                                <div className="flex-shrink-0 space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <FolderIcon className="h-3 w-3" />
                                        Select Version
                                    </label>
                                    <div className="space-y-2">
                                        <VersionRow
                                            label="Original"
                                            size="FULL"
                                            isSelected={selectedVersion.size === 'Original'}
                                            onClick={() => handleVersionSelect(`${API_BASE}${selectedMedia.url}`, 'Original')}
                                        />
                                        {selectedMedia.metadata?.versions && Object.entries(selectedMedia.metadata.versions).map(([size, url]) => (
                                            <VersionRow
                                                key={size}
                                                label={`WebP ${size}`}
                                                size="OPT"
                                                isSelected={selectedVersion.url === `${API_BASE}${url}`}
                                                onClick={() => handleVersionSelect(`${API_BASE}${url}`, size)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Alt Text */}
                            <div className="flex-shrink-0 space-y-4 mb-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <ClipboardDocumentIcon className="h-3 w-3" />
                                        Alt Text
                                    </label>
                                </div>
                                <textarea
                                    value={editAlt}
                                    onChange={(e) => setEditAlt(e.target.value)}
                                    className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 text-xs font-medium min-h-[100px] resize-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                    placeholder="Describe this asset for SEO..."
                                />
                            </div>
                        </div>

                        {/* Insert Button (Fixed Bottom) */}
                        {!isStandalone && (
                            <div className="p-4 border-t border-slate-100 bg-white z-10">
                                <button
                                    onClick={handleInsertClick}
                                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-600/30 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 active:translate-y-0"
                                >
                                    Insert Selected Asset
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    if (isStandalone) {
        return (
            <>
                {content}
                {genericAlert}
                {unsavedChangesAlert}
            </>
        );
    }

    return (
        <>
            {createPortal(
                <div className="fixed inset-0 z-[9999] bg-white animate-in slide-in-from-bottom-5 duration-300 flex flex-col">
                    {content}
                </div>,
                document.body
            )}
            {genericAlert}
            {unsavedChangesAlert}
        </>
    );
}

function VersionRow({ label, size, isSelected, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${isSelected
                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
        >
            <span className="text-xs font-bold">{label}</span>
            {isSelected && <CheckCircleIcon className="h-5 w-5" />}
        </button>
    );
}
