'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    PlusIcon,
    TrashIcon,
    Bars2Icon,
    ArrowLeftIcon,
    CloudArrowUpIcon,
    LinkIcon,
    IdentificationIcon,
    PaperAirplaneIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { useSettings } from '@/context/SettingsContext';
import UnsavedChangesAlert from '@/components/ui/UnsavedChangesAlert';

export default function MenuEditor({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { showToast } = useNotification();
    const { settings } = useSettings();
    const isNew = id === 'new';
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [contentTheme, setContentTheme] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(!isNew);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isNew) {
            fetchMenu();
        }
    }, [id]);

    const [initialState, setInitialState] = useState<any>(null);
    const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);

    useEffect(() => {
        if (!isNew) {
            fetchMenu();
        } else {
            // For new menus, initial state is empty
            setInitialState({ name: '', slug: '', items: [] });
        }
    }, [id]);

    const fetchMenu = async () => {
        try {
            const data = await apiRequest(`/menus/${id}`);
            
            const activeTheme = settings['active_theme'];
            const menuTheme = data.theme;

            if (menuTheme && activeTheme && menuTheme !== activeTheme) {
                setIsReadOnly(true);
                setContentTheme(menuTheme);
            } else {
                setIsReadOnly(false);
                setContentTheme(null);
            }

            setName(data.name);
            setSlug(data.slug);
            setItems(data.items || []);
            setInitialState({ name: data.name, slug: data.slug, items: data.items || [] });
        } catch (error: any) {
            showToast(error.message || 'Failed to fetch menu', 'error');
            router.push('/dashboard/menus');
        } finally {
            setIsLoading(false);
        }
    };

    const isDirty = () => {
        if (!initialState) return false;
        const current = { name, slug, items };
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
        if (!name || !slug) {
            showToast('Name and Slug are required', 'error');
            return false;
        }

        setIsSaving(true);
        try {
            const body = { name, slug, items };
            if (isNew) {
                await apiRequest('/menus', { method: 'POST', body });
                showToast('Menu created successfully', 'success');
            } else {
                await apiRequest(`/menus/${id}`, { method: 'PATCH', body });
                showToast('Menu updated successfully', 'success');
            }
            // Update initial state after successful save
            setInitialState(body);
            return true;
        } catch (error: any) {
            showToast(error.message || 'Failed to save menu', 'error');
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const addMenuItem = () => {
        setItems([...items, { label: '', url: '', target: '_self', order: items.length }]);
    };

    const updateMenuItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const removeMenuItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[500px] gap-4">
                <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Editor...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
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

            {isReadOnly && (
                <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500 mx-2">
                    <div className="bg-amber-100 p-3 rounded-2xl">
                        <ExclamationCircleIcon className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-amber-900 tracking-tight">Incompatible Theme Menu</h3>
                        <p className="text-xs font-semibold text-amber-700 mt-0.5">
                            This menu structure belongs to the <span className="underline decoration-2 underline-offset-2 capitalize">{contentTheme || 'another'}</span> theme. 
                            You can inspect its links here, but modifications are restricted unless you switch themes in Settings.
                        </p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm sticky top-0 z-20 mx-2">
                <div className="flex items-center gap-4">
                    <button onClick={handleBack} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-500 transition-all hover:scale-105 active:scale-95">
                        <ArrowLeftIcon className="h-5 w-5" strokeWidth={2.5} />
                    </button>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{isNew ? 'New Structure' : 'Edit Navigation'}</p>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{isNew ? 'Create New Menu' : name}</h1>
                    </div>
                </div>
                 <button
                    onClick={() => handleSave().then(success => { if (success) router.push('/dashboard/menus'); })}
                    disabled={isSaving || isReadOnly}
                    className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <CloudArrowUpIcon className="h-5 w-5" />
                    {isSaving ? 'Saving...' : (isReadOnly ? 'Read Only' : 'Save Changes')}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mx-2">
                {/* Left: General Settings */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm space-y-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Menu Name</label>
                                <div className="relative group">
                                    <IdentificationIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                     <input
                                        type="text"
                                        value={name}
                                        disabled={isReadOnly}
                                        onChange={(e) => {
                                            setName(e.target.value);
                                            if (isNew) setSlug(e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
                                        }}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all disabled:opacity-50"
                                        placeholder="e.g. Main Header Menu"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Menu API Slug</label>
                                <div className="relative group">
                                    <PaperAirplaneIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                     <input
                                        type="text"
                                        value={slug}
                                        disabled={isReadOnly}
                                        onChange={(e) => setSlug(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold font-mono text-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all disabled:opacity-50"
                                        placeholder="main-menu"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium ml-1">Unique identifier used to fetch this menu in your frontend components.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Menu Items (Links) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Menu Items</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Manage links and hierarchy</p>
                            </div>
                             <button
                                onClick={addMenuItem}
                                disabled={isReadOnly}
                                className="flex items-center gap-2 bg-slate-50 text-blue-600 hover:bg-blue-600 hover:text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <PlusIcon className="h-4 w-4" strokeWidth={3} />
                                Add Link
                            </button>
                        </div>

                        <div className="space-y-4">
                            {items.length === 0 ? (
                                <div className="py-12 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                                    <LinkIcon className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-sm font-bold text-slate-400">No items added to this menu yet.</p>
                                </div>
                            ) : (
                                items.map((item, index) => (
                                    <div key={index} className="group bg-slate-50 rounded-3xl p-6 border border-slate-100 hover:border-blue-200 hover:bg-white transition-all">
                                        <div className="flex items-start gap-4">
                                            <div className="mt-2 text-slate-300">
                                                <Bars2Icon className="h-5 w-5 cursor-move" />
                                            </div>
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Label</label>
                                                     <input
                                                        type="text"
                                                        value={item.label}
                                                        disabled={isReadOnly}
                                                        onChange={(e) => updateMenuItem(index, 'label', e.target.value)}
                                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-blue-600/5 disabled:opacity-50"
                                                        placeholder="e.g. Services"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">URL / Path</label>
                                                     <input
                                                        type="text"
                                                        value={item.url}
                                                        disabled={isReadOnly}
                                                        onChange={(e) => updateMenuItem(index, 'url', e.target.value)}
                                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-blue-600/5 disabled:opacity-50"
                                                        placeholder="/services"
                                                    />
                                                </div>
                                                <div className="md:col-span-2 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Target:</span>
                                                             <select
                                                                value={item.target}
                                                                disabled={isReadOnly}
                                                                onChange={(e) => updateMenuItem(index, 'target', e.target.value)}
                                                                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold focus:outline-none disabled:opacity-50"
                                                            >
                                                                <option value="_self">Same Window</option>
                                                                <option value="_blank">New Tab</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                     <button
                                                        onClick={() => removeMenuItem(index)}
                                                        disabled={isReadOnly}
                                                        className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-0 disabled:cursor-not-allowed"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
