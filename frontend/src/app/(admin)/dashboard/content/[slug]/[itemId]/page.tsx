'use client';

import React, { useEffect, useState, use, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import {
    ArrowLeftIcon,
    CloudArrowUpIcon,
    PhotoIcon,
    DocumentTextIcon,
    HashtagIcon as HashIcon,
    CalendarDaysIcon,
    AdjustmentsHorizontalIcon,
    Bars2Icon,
    DevicePhoneMobileIcon,
    LinkIcon,
    SwatchIcon,
    DocumentIcon,
    AtSymbolIcon
} from '@heroicons/react/24/outline';
import { useNotification } from '@/context/NotificationContext';
import PostEditor from '@/components/blog/PostEditor';
import MediaLibrary from '@/components/media/MediaLibrary';
import UnsavedChangesAlert from '@/components/ui/UnsavedChangesAlert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function ContentEditorContent({ params }: { params: Promise<{ slug: string, itemId: string }> }) {
    const router = useRouter();
    const { slug, itemId } = use(params);
    const isNew = itemId === 'new';

    const [collection, setCollection] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});
    const [isPublished, setIsPublished] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [isMediaOpen, setIsMediaOpen] = useState(false);
    const [activeMediaField, setActiveMediaField] = useState<string | null>(null);

    const [initialState, setInitialState] = useState<any>(null);
    const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);

    const { showToast } = useNotification();

    useEffect(() => {
        fetchData();
    }, [slug, itemId]);

    const fetchData = async () => {
        try {
            // Fetch All Collections to find our schema
            const collections = await apiRequest('/collections');
            const col = collections.find((c: any) => c.slug === slug);

            if (!col) {
                showToast('Collection not found', 'error');
                router.push('/dashboard/collections');
                return;
            }
            setCollection(col);

            // Initialize form data with defaults
            const defaults: any = {};
            col.fields.forEach((f: any) => {
                if (f.type === 'boolean') defaults[f.name] = false;
                else if (f.type === 'number') defaults[f.name] = 0;
                else defaults[f.name] = '';
            });

            if (!isNew) {
                const item = await apiRequest(`/content-items/${itemId}`);
                setFormData(item.data);
                setIsPublished(item.isPublished);
                setInitialState({ data: item.data, isPublished: item.isPublished });
            } else {
                setFormData(defaults);
                setInitialState({ data: defaults, isPublished: true });
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to load item', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const isDirty = () => {
        if (!initialState) return false;
        const current = { data: formData, isPublished };
        return JSON.stringify(current) !== JSON.stringify(initialState);
    };

    const handleBack = () => {
        if (isDirty()) {
            setShowUnsavedAlert(true);
        } else {
            router.back();
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload = {
                collectionId: collection.id,
                data: formData,
                isPublished,
                slug: formData.slug || formData.title?.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') || undefined
            };

            if (isNew) {
                await apiRequest('/content-items', { method: 'POST', body: payload });
                showToast('Entry created successfully', 'success');
            } else {
                await apiRequest(`/content-items/${itemId}`, { method: 'PATCH', body: payload });
                showToast('Entry updated successfully', 'success');
            }
            // Update initial state
            setInitialState({ data: formData, isPublished });
            return true;
        } catch (error: any) {
            showToast(error.message || 'Failed to save entry', 'error');
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const updateFormData = (key: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
    };

    const openMediaLibrary = (fieldName: string) => {
        setActiveMediaField(fieldName);
        setIsMediaOpen(true);
    };

    if (isLoading) return (
        <div className="flex items-center justify-center p-20">
            <LoadingSpinner size="lg" />
        </div>
    );
    if (!collection) return null;

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
            <UnsavedChangesAlert
                isOpen={showUnsavedAlert}
                onSaveAndExit={async () => {
                    const success = await handleSave();
                    if (success) router.back();
                }}
                onDiscardAndExit={() => router.back()}
                onCancel={() => setShowUnsavedAlert(false)}
                isSaving={isSaving}
            />

            {/* Header */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={handleBack} className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors">
                        <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isNew ? `New ${collection.name}` : 'Editing Entry'}</p>
                        <h1 className="text-xl font-bold text-slate-900 font-display">{collection.name}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={isPublished ? 'true' : 'false'}
                        onChange={(e) => setIsPublished(e.target.value === 'true')}
                        className="bg-slate-50 border-none text-xs font-bold text-slate-600 py-2.5 px-4 rounded-xl focus:ring-0 cursor-pointer"
                    >
                        <option value="true">Published</option>
                        <option value="false">Draft</option>
                    </select>
                    <button
                        onClick={() => handleSave().then(success => { if (success) router.push(`/dashboard/content/${slug}`); })}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                    >
                        <CloudArrowUpIcon className="h-4 w-4" />
                        {isSaving ? 'Saving...' : 'Save Entry'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-8">
                        {collection.fields.filter((f: any) => ['text', 'rich-text', 'number', 'date', 'url', 'email', 'tel', 'color'].includes(f.type)).map((field: any) => (
                            <div key={field.id} className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>

                                {field.type === 'rich-text' ? (
                                    <PostEditor
                                        content={formData[field.name] || ''}
                                        onChange={(html) => updateFormData(field.name, html)}
                                    />
                                ) : field.type === 'number' ? (
                                    <div className="relative">
                                        <HashIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            type="number"
                                            value={formData[field.name] || 0}
                                            onChange={(e) => updateFormData(field.name, parseFloat(e.target.value))}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10"
                                        />
                                    </div>
                                ) : field.type === 'date' ? (
                                    <div className="relative">
                                        <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            type="date"
                                            value={formData[field.name] || ''}
                                            onChange={(e) => updateFormData(field.name, e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10"
                                        />
                                    </div>
                                ) : field.type === 'url' ? (
                                    <div className="relative">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            type="url"
                                            value={formData[field.name] || ''}
                                            onChange={(e) => updateFormData(field.name, e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10"
                                            placeholder="https://..."
                                        />
                                    </div>
                                ) : field.type === 'email' ? (
                                    <div className="relative">
                                        <AtSymbolIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            type="email"
                                            value={formData[field.name] || ''}
                                            onChange={(e) => updateFormData(field.name, e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10"
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                ) : field.type === 'tel' ? (
                                    <div className="relative">
                                        <DevicePhoneMobileIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            type="tel"
                                            value={formData[field.name] || ''}
                                            onChange={(e) => updateFormData(field.name, e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10"
                                            placeholder="+1..."
                                        />
                                    </div>
                                ) : field.type === 'color' ? (
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                                            <input
                                                type="color"
                                                value={formData[field.name] || '#3b82f6'}
                                                onChange={(e) => updateFormData(field.name, e.target.value)}
                                                className="absolute inset-x-[-100%] inset-y-[-100%] w-[300%] h-[300%] cursor-pointer"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={formData[field.name] || '#3b82f6'}
                                            onChange={(e) => updateFormData(field.name, e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-600/10"
                                        />
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        value={formData[field.name] || ''}
                                        onChange={(e) => updateFormData(field.name, e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10"
                                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar: Images & Switches */}
                <div className="space-y-6">
                    {collection.fields.filter((f: any) => ['image', 'file', 'boolean'].includes(f.type)).map((field: any) => (
                        <div key={field.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                                {field.label}
                            </label>

                            {field.type === 'image' ? (
                                <div
                                    onClick={() => openMediaLibrary(field.name)}
                                    className="aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100/50 hover:border-blue-400 hover:text-blue-500 transition-all cursor-pointer group overflow-hidden relative"
                                >
                                    {formData[field.name] ? (
                                        <img src={formData[field.name]} className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <PhotoIcon className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
                                            <span className="text-[10px] font-bold">Select Image</span>
                                        </>
                                    )}
                                </div>
                            ) : field.type === 'file' ? (
                                <div
                                    onClick={() => openMediaLibrary(field.name)}
                                    className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-4 flex items-center gap-3 text-slate-400 hover:bg-slate-100/50 hover:border-blue-400 hover:text-blue-500 transition-all cursor-pointer group"
                                >
                                    <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                        <DocumentIcon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold truncate">
                                            {formData[field.name] ? formData[field.name].split('/').pop() : 'Select File'}
                                        </p>
                                        <p className="text-[8px] font-medium text-slate-300 uppercase tracking-widest">Media Library</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-600 italic">Toggle active/inactive</span>
                                    <button
                                        onClick={() => updateFormData(field.name, !formData[field.name])}
                                        className={`transition-colors h-6 w-11 rounded-full relative ${formData[field.name] ? 'bg-blue-600' : 'bg-slate-200'}`}
                                    >
                                        <div className={`absolute top-1 transform transition-all h-4 w-4 rounded-full bg-white ${formData[field.name] ? 'left-6' : 'left-1'}`} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Default Slug Field */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                            SEO Friendly Slug
                        </label>
                        <input
                            type="text"
                            name="slug"
                            value={formData.slug || ''}
                            onChange={(e) => updateFormData('slug', e.target.value)}
                            placeholder="auto-generated-if-empty"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold font-mono text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/10"
                        />
                    </div>
                </div>
            </div>

            <MediaLibrary
                isOpen={isMediaOpen}
                onClose={() => setIsMediaOpen(false)}
                onSelect={(url) => {
                    if (activeMediaField) updateFormData(activeMediaField, url);
                    setIsMediaOpen(false);
                }}
            />
        </div>
    );
}

export default function ContentEditorPage({ params }: { params: Promise<{ slug: string, itemId: string }> }) {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-20">
                <LoadingSpinner size="lg" />
            </div>
        }>
            <ContentEditorContent params={params} />
        </Suspense>
    );
}
