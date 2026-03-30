'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import {
    ArrowLeftIcon,
    PaperAirplaneIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { use } from 'react';
import { useSettings } from '@/context/SettingsContext';
import UnsavedChangesAlert from '@/components/ui/UnsavedChangesAlert';
import { SERVICE_ICONS } from '@/lib/service-icons';

interface ServiceFormData {
    title: string;
    subtitle: string;
    description: string;
    processSteps: string;
    icon: string;
    order: number;
}

export default function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
    const { showToast } = useNotification();
    const { settings } = useSettings();
    const router = useRouter();
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [contentTheme, setContentTheme] = useState<string | null>(null);
    const { register, handleSubmit, reset, setValue, watch, formState: { errors, isDirty } } = useForm<ServiceFormData>();

    useEffect(() => {
        fetchService();
    }, [id]);

    const fetchService = async () => {
        try {
            setIsLoading(true);
            const data = await apiRequest(`/services/${id}`);
            if (data) {
                const activeTheme = settings['active_theme'];
                const serviceTheme = data.theme;
                
                if (serviceTheme && activeTheme && serviceTheme !== activeTheme) {
                    setIsReadOnly(true);
                    setContentTheme(serviceTheme);
                } else {
                    setIsReadOnly(false);
                    setContentTheme(null);
                }

                const steps = Array.isArray(data.processSteps) ? data.processSteps.join('\n') : '';
                reset({
                    title: data.title,
                    subtitle: data.subtitle || '',
                    description: data.description || '',
                    processSteps: steps,
                    icon: data.icon || '',
                    order: data.order || 0
                });
            }
        } catch (error) {
            console.error('Failed to fetch service:', error);
            showToast('Failed to load service details', 'error');
            router.push('/dashboard/services');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        if (isDirty) {
            setShowUnsavedAlert(true);
        } else {
            router.back();
        }
    };

    const onSubmit = async (data: ServiceFormData) => {
        setIsSubmitting(true);
        try {
            const processSteps = data.processSteps
                ? data.processSteps.split('\n').map(s => s.trim()).filter(Boolean)
                : [];
            await apiRequest(`/services/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    ...data,
                    processSteps,
                    order: Number(data.order)
                })
            });
            showToast('Service updated successfully', 'success');
            // Reset form token to clean state so we can redirect without alert thinking it's dirty if we were using a router guard (not used here but good practice)
            reset(data);
            router.push('/dashboard/services');
            return true;
        } catch (error) {
            console.error('Failed to update service:', error);
            showToast('Failed to update service', 'error');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <UnsavedChangesAlert
                isOpen={showUnsavedAlert}
                onSaveAndExit={async () => {
                    await handleSubmit(async (data) => {
                        const success = await onSubmit(data);
                        if (success) router.back();
                    })();
                }}
                onDiscardAndExit={() => router.back()}
                onCancel={() => setShowUnsavedAlert(false)}
                isSaving={isSubmitting}
            />

            {isReadOnly && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-amber-100 p-2 rounded-xl">
                        <ExclamationCircleIcon className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-amber-900">Incompatible Theme Content</h3>
                        <p className="text-xs font-semibold text-amber-700 mt-0.5">
                            This service was created for the <span className="underline decoration-2 underline-offset-2 capitalize">{contentTheme || 'another'}</span> theme. 
                            You can view it here, but to make changes, please switch the active theme in Settings.
                        </p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={handleBack}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm hover:shadow-md"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
                        Edit <span className="text-blue-600">Service</span>
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 font-semibold tracking-tight">
                        Update service details.
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200 p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                Title <span className="text-blue-500 font-bold">*</span>
                            </label>
                            <input
                                type="text"
                                {...register('title', { required: 'Title is required' })}
                                disabled={isReadOnly}
                                className={`w-full bg-slate-50 border-2 rounded-2xl px-5 py-4 text-sm font-medium transition-all ${errors.title
                                    ? 'border-red-200 focus:border-red-500 focus:ring-red-500/10'
                                    : 'border-slate-100 focus:border-blue-500 focus:ring-blue-500/10'
                                    } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                placeholder="e.g. Architectural Design"
                            />
                            {errors.title && (
                                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1 flex items-center gap-1">
                                    <ExclamationCircleIcon className="h-3 w-3" />
                                    {errors.title.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                Subtitle
                            </label>
                            <input
                                type="text"
                                {...register('subtitle')}
                                disabled={isReadOnly}
                                className={`w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium transition-all focus:border-blue-500 focus:ring-blue-500/10 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                placeholder="e.g. Residential · Commercial · Agricultural"
                            />
                            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-wide">Short tagline shown below title</p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                Description
                            </label>
                             <textarea
                                {...register('description')}
                                disabled={isReadOnly}
                                rows={4}
                                className={`w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium transition-all focus:border-blue-500 focus:ring-blue-500/10 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                placeholder="Brief description of the service..."
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                Process Steps
                            </label>
                            <textarea
                                {...register('processSteps')}
                                disabled={isReadOnly}
                                rows={5}
                                className={`w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium transition-all focus:border-blue-500 focus:ring-blue-500/10 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                placeholder="Site selection & shortlisting&#10;Legal title verification&#10;Price negotiation support&#10;Registration at Land Revenue Office"
                            />
                            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-wide">One step per line — shown as numbered list on services page</p>
                        </div>

                        <input type="hidden" {...register('icon')} />
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Icon</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem', opacity: isReadOnly ? 0.5 : 1, pointerEvents: isReadOnly ? 'none' : 'auto' }}>
                                {SERVICE_ICONS.map(ic => {
                                    const selected = watch('icon') === ic.name;
                                    return (
                                        <button
                                            key={ic.name}
                                            type="button"
                                            title={ic.label}
                                            onClick={() => setValue('icon', ic.name, { shouldDirty: true })}
                                            style={{
                                                padding: '0.75rem 0.5rem',
                                                borderRadius: '12px',
                                                border: selected ? '2px solid #3B82F6' : '2px solid #E2E8F0',
                                                background: selected ? '#EFF6FF' : '#F8FAFC',
                                                color: selected ? '#3B82F6' : '#94A3B8',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.35rem',
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            <ic.icon className="w-7 h-7 stroke-[1.75]" />
                                            <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1 }}>{ic.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                Sort Order
                            </label>
                            <input
                                type="number"
                                {...register('order')}
                                disabled={isReadOnly}
                                className={`w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium transition-all focus:border-blue-500 focus:ring-blue-500/10 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                         <button
                            type="submit"
                            disabled={isSubmitting || isReadOnly}
                            className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    {isReadOnly ? 'Read Only Mode' : 'Update Service'}
                                    {!isReadOnly && <PaperAirplaneIcon className="h-4 w-4 text-blue-400 -rotate-45" />}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
