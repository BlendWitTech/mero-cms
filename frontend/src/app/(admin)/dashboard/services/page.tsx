'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    ArrowLeftIcon,
    CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import IconPicker, { iconMap } from '@/components/ui/IconPicker';
import { useForm } from '@/context/FormContext';
import UnsavedChangesAlert from '@/components/ui/UnsavedChangesAlert';
import AlertDialog from '@/components/ui/AlertDialog';
import ThemeCompatibilityBanner, { useThemeCompatibility } from '@/components/ui/ThemeCompatibilityBanner';


interface Service {
    id: string;
    title: string;
    description: string;
    icon: string;
    order: number;
    updatedAt: string;
}

function ServicesPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { setIsDirty, registerSaveHandler } = useForm();
    const { showToast } = useNotification();
    const { isSupported } = useThemeCompatibility('services');

    // Derived state
    const view = searchParams.get('action') === 'new' || searchParams.get('action') === 'edit' ? 'editor' : 'list';
    const actionId = searchParams.get('id');

    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showExitAlert, setShowExitAlert] = useState(false);

    const defaultFormData = {
        title: '',
        description: '',
        icon: 'ShieldCheckIcon', // Default
        order: 0
    };

    const [formData, setFormData] = useState<any>(defaultFormData);
    const [initialState, setInitialState] = useState<any>(defaultFormData);
    const [currentId, setCurrentId] = useState<string | null>(null);

    useEffect(() => {
        fetchServices();
    }, []);

    // Sync isDirty
    useEffect(() => {
        const dirty = JSON.stringify(formData) !== JSON.stringify(initialState);
        setIsDirty(dirty);
    }, [formData, initialState, setIsDirty]);

    // Register Save Handler
    useEffect(() => {
        if (view === 'editor') {
            registerSaveHandler(async () => {
                await handleSave(true); // true = redirect after save
            });
        } else {
            registerSaveHandler(null);
        }
        return () => registerSaveHandler(null);
    }, [view, formData, currentId]); // Depend on formData/id to capture current state in closure

    // Handle URL State
    useEffect(() => {
        const action = searchParams.get('action');
        const id = searchParams.get('id');

        if (!isLoading) {
            if (action === 'new') {
                const initial = { ...defaultFormData, order: services.length + 1 };
                setFormData(initial);
                setInitialState(initial);
                setCurrentId(null);
            } else if (action === 'edit' && id) {
                const service = services.find(s => s.id === id);
                if (service) {
                    const data = {
                        title: service.title,
                        description: service.description,
                        icon: service.icon || 'ShieldCheckIcon',
                        order: service.order
                    };
                    setFormData(data);
                    setInitialState(data);
                    setCurrentId(id);
                }
            }
        }
    }, [searchParams, isLoading, services]);

    const fetchServices = async () => {
        try {
            setIsLoading(true);
            const data = await apiRequest('/services');
            setServices(data || []);
        } catch (error) {
            console.error('Failed to fetch services:', error);
            showToast('Failed to load services', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = () => {
        router.push('/dashboard/services?action=new');
    };

    const handleEdit = (service: Service) => {
        router.push(`/dashboard/services?action=edit&id=${service.id}`);
    };

    const handleBack = () => {
        if (JSON.stringify(formData) !== JSON.stringify(initialState)) {
            setShowExitAlert(true);
        } else {
            router.push('/dashboard/services');
        }
    };

    const confirmDiscard = () => {
        setShowExitAlert(false);
        setIsDirty(false);
        router.push('/dashboard/services');
    };

    const handleSave = async (redirect = false) => {
        setIsSaving(true);
        const url = currentId ? `/services/${currentId}` : '/services';
        const method = currentId ? 'PATCH' : 'POST';

        try {
            await apiRequest(url, {
                method,
                body: { ...formData, order: Number(formData.order) },
                skipNotification: true
            });

            showToast(`Service ${currentId ? 'updated' : 'created'} successfully`, 'success');
            setIsDirty(false);
            if (redirect) {
                router.push('/dashboard/services');
            } else {
                fetchServices(); // Refresh list if staying (though usually redirects)
                // If staying, update initial state to match new saved state
                // But typically we redirect or stay. If staying, currentId might change if was 'new'
            }
            if (!redirect && !currentId) {
                // If it was a create action and we didn't redirect, we need to handle state update.
                // But for now, assuming standard flow
            }
        } catch (error: any) {
            showToast(error.message || 'Failed to save service', 'error');
            throw error; // Propagate for saveHandler
        } finally {
            setIsSaving(false);
            setShowExitAlert(false);
        }
    };

    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; serviceId: string | null }>({
        isOpen: false,
        serviceId: null
    });

    const handleDeleteClick = (id: string) => {
        setDeleteConfirmation({ isOpen: true, serviceId: id });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation.serviceId) return;

        try {
            await apiRequest(`/services/${deleteConfirmation.serviceId}`, { method: 'DELETE' });
            showToast('Service deleted successfully', 'success');
            fetchServices();
            setDeleteConfirmation({ isOpen: false, serviceId: null });
        } catch (error) {
            console.error('Failed to delete service:', error);
            showToast('Failed to delete service', 'error');
            setDeleteConfirmation({ isOpen: false, serviceId: null });
        }
    };

    const cancelDelete = () => {
        setDeleteConfirmation({ isOpen: false, serviceId: null });
    };

    if (view === 'editor') {
        return (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all"
                        >
                            <ArrowLeftIcon className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 font-display tracking-tight">
                                {currentId ? 'Edit Service' : 'New Service'}
                            </h1>
                            <p className="text-sm font-medium text-slate-500">Define service details and iconography.</p>
                        </div>
                    </div>
                </div>

                <ThemeCompatibilityBanner moduleName="services" />

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/50 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Service Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            disabled={!isSupported}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white focus:border-blue-600 transition-all disabled:opacity-50"
                            placeholder="e.g. Architectural Design"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Description</label>
                        <textarea
                             value={formData.description}
                            disabled={!isSupported}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white focus:border-blue-600 transition-all resize-none disabled:opacity-50"
                            placeholder="Brief description of the service..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Display Order</label>
                        <input
                            type="number"
                             value={formData.order}
                            disabled={!isSupported}
                            onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white focus:border-blue-600 transition-all disabled:opacity-50"
                        />
                    </div>

                    <IconPicker
                        value={formData.icon}
                        onChange={(icon) => setFormData({ ...formData, icon })}
                        label="Service Icon"
                    />

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all"
                        >
                            Cancel
                        </button>
                         <button
                            onClick={() => handleSave()}
                            disabled={isSaving || !isSupported}
                            className="inline-flex items-center gap-2 px-8 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <CloudArrowUpIcon className="h-5 w-5" strokeWidth={2} />
                            )}
                            <span>{!isSupported ? 'Unsupported by Theme' : (currentId ? 'Update Service' : 'Create Service')}</span>
                        </button>
                    </div>
                </div>
                <UnsavedChangesAlert
                    isOpen={showExitAlert}
                    onSaveAndExit={() => handleSave(true)}
                    onDiscardAndExit={confirmDiscard}
                    onCancel={() => setShowExitAlert(false)}
                    title="Unsaved Changes"
                    description="You have unsaved changes. dealing with them now?"
                    confirmLabel="Save & Exit"
                    secondaryLabel="Discard & Leave"
                    cancelLabel="Keep Editing"
                    variant="success"
                />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
                        Services <span className="text-blue-600">Management</span>
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 font-semibold tracking-tight">
                        Manage your service offerings and their display order.
                    </p>
                </div>
                 <button
                    onClick={handleCreate}
                    disabled={!isSupported}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 shadow-lg shadow-emerald-600/30 text-white font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 hover:-translate-y-0.5 transition-all active:translate-y-0 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                    <PlusIcon className="h-4 w-4" />
                    New Service
                </button>
            </div>

            <ThemeCompatibilityBanner moduleName="services" />

            {/* List */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-slate-200/20 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 flex justify-center">
                        <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                ) : services.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-slate-400 font-medium">No services found. Create one to get started.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-full">Title</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Updated</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {services.map((service) => {
                                    const Icon = iconMap[service.icon] || null;
                                    return (
                                        <tr key={service.id} className="group hover:bg-blue-50/30 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs">
                                                    {service.order}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    {Icon && (
                                                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                                            <Icon className="h-6 w-6" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-bold text-slate-900">{service.title}</p>
                                                        <p className="text-xs text-slate-500 line-clamp-1">{service.description}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-xs font-semibold text-slate-500">
                                                    {new Date(service.updatedAt).toLocaleDateString()}
                                                </p>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(service)}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                    >
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(service.id)}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>


            <AlertDialog
                isOpen={deleteConfirmation.isOpen}
                title="Delete Service"
                description="Are you sure you want to delete this service? This action cannot be undone."
                confirmLabel="Delete Service"
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        </div >
    );
}

export default function ServicesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        }>
            <ServicesPageContent />
        </Suspense>
    );
}
