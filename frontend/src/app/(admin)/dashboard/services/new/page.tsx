'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeftIcon,
    PaperAirplaneIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { SERVICE_ICONS } from '@/lib/service-icons';
import { useForm } from 'react-hook-form';

interface ServiceFormData {
    title: string;
    description: string;
    icon: string;
    order: number;
}

export default function NewServicePage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useNotification();
    const router = useRouter();
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ServiceFormData>({
        defaultValues: {
            order: 0
        }
    });

    const onSubmit = async (data: ServiceFormData) => {
        setIsSubmitting(true);
        try {
            await apiRequest('/services', {
                method: 'POST',
                body: {
                    title: data.title,
                    description: data.description,
                    icon: data.icon,
                    processSteps: (data as any).processSteps, // Assuming processSteps might be added later or is optional
                    order: Number(data.order)
                }
            });
            showToast('Service created successfully', 'success');
            router.push('/dashboard/services');
        } catch (error) {
            console.error('Failed to create service:', error);
            showToast('Failed to create service', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/services"
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm hover:shadow-md"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
                        New <span className="text-blue-600">Service</span>
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 font-semibold tracking-tight">
                        Add a new service to your offering.
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
                                className={`w-full bg-slate-50 border-2 rounded-2xl px-5 py-4 text-sm font-medium transition-all ${errors.title
                                    ? 'border-red-200 focus:border-red-500 focus:ring-red-500/10'
                                    : 'border-slate-100 focus:border-blue-500 focus:ring-blue-500/10'
                                    }`}
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
                                Description
                            </label>
                            <textarea
                                {...register('description')}
                                rows={4}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium transition-all focus:border-blue-500 focus:ring-blue-500/10"
                                placeholder="Brief description of the service..."
                            />
                        </div>

                        <input type="hidden" {...register('icon')} />
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Icon</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem' }}>
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

                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                    Sort Order
                                </label>
                                <input
                                    type="number"
                                    {...register('order')}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium transition-all focus:border-blue-500 focus:ring-blue-500/10"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Create Service
                                    <PaperAirplaneIcon className="h-4 w-4 text-blue-400 -rotate-45" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
