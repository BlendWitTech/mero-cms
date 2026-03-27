'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import {
    ArrowLeftIcon,
    PaperAirplaneIcon,
    ExclamationCircleIcon,
    ArrowUpTrayIcon,
    StarIcon as StarIconOutline
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { useSettings } from '@/context/SettingsContext';
import UnsavedChangesAlert from '@/components/ui/UnsavedChangesAlert';
import MediaPickerModal from '@/components/ui/MediaPickerModal';

interface TestimonialFormData {
    clientName: string;
    clientRole: string;
    content: string;
    rating: number;
    clientPhoto: string;
}

export default function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
    const { showToast } = useNotification();
    const { settings } = useSettings();
    const router = useRouter();
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [contentTheme, setContentTheme] = useState<string | null>(null);
    const [isMediaOpen, setIsMediaOpen] = useState(false);
    const { register, handleSubmit, watch, reset, setValue, formState: { errors, isDirty } } = useForm<TestimonialFormData>({
        defaultValues: {
            rating: 5
        }
    });

    const currentRating = watch('rating');

    useEffect(() => {
        fetchTestimonial();
    }, [id]);

    const fetchTestimonial = async () => {
        try {
            setIsLoading(true);
            const data = await apiRequest(`/testimonials/${id}`);
            if (data) {
                const activeTheme = settings['active_theme'];
                const testimonialTheme = data.theme;

                if (testimonialTheme && activeTheme && testimonialTheme !== activeTheme) {
                    setIsReadOnly(true);
                    setContentTheme(testimonialTheme);
                } else {
                    setIsReadOnly(false);
                    setContentTheme(null);
                }

                reset({
                    clientName: data.clientName,
                    clientRole: data.clientRole || '',
                    content: data.content,
                    rating: data.rating || 5,
                    clientPhoto: data.clientPhoto || ''
                });
            }
        } catch (error) {
            console.error('Failed to fetch testimonial:', error);
            showToast('Failed to load testimonial details', 'error');
            router.push('/dashboard/testimonials');
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

    const onSubmit = async (data: TestimonialFormData) => {
        setIsSubmitting(true);
        try {
            await apiRequest(`/testimonials/${id}`, {
                method: 'PATCH',
                body: {
                    ...data,
                    rating: Number(data.rating)
                }
            });
            showToast('Testimonial updated successfully', 'success');
            // Reset to prevent unsaved alert
            reset(data);
            router.push('/dashboard/testimonials');
            return true;
        } catch (error) {
            console.error('Failed to update testimonial:', error);
            showToast('Failed to update testimonial', 'error');
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
                            This testimonial was created for the <span className="underline decoration-2 underline-offset-2 capitalize">{contentTheme || 'another'}</span> theme. 
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
                        Edit <span className="text-blue-600">Testimonial</span>
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 font-semibold tracking-tight">
                        Update client review.
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200 p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                    Client Name <span className="text-blue-500 font-bold">*</span>
                                </label>
                                 <input
                                    type="text"
                                    {...register('clientName', { required: 'Client Name is required' })}
                                    disabled={isReadOnly}
                                    className={`w-full bg-slate-50 border-2 rounded-2xl px-5 py-4 text-sm font-medium transition-all ${errors.clientName
                                        ? 'border-red-200 focus:border-red-500 focus:ring-red-500/10'
                                        : 'border-slate-100 focus:border-blue-500 focus:ring-blue-500/10'
                                        } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    placeholder="e.g. John Doe"
                                />
                                {errors.clientName && (
                                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1 flex items-center gap-1">
                                        <ExclamationCircleIcon className="h-3 w-3" />
                                        {errors.clientName.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                    Client Role
                                </label>
                                 <input
                                    type="text"
                                    {...register('clientRole')}
                                    disabled={isReadOnly}
                                    className={`w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium transition-all focus:border-blue-500 focus:ring-blue-500/10 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    placeholder="e.g. CEO, Tech Corp"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                Testimonial Content <span className="text-blue-500 font-bold">*</span>
                            </label>
                             <textarea
                                {...register('content', { required: 'Content is required' })}
                                disabled={isReadOnly}
                                rows={4}
                                className={`w-full bg-slate-50 border-2 rounded-2xl px-5 py-4 text-sm font-medium transition-all ${errors.content
                                    ? 'border-red-200 focus:border-red-500 focus:ring-red-500/10'
                                    : 'border-slate-100 focus:border-blue-500 focus:ring-blue-500/10'
                                    } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                placeholder="What did they say?"
                            />
                            {errors.content && (
                                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1 flex items-center gap-1">
                                    <ExclamationCircleIcon className="h-3 w-3" />
                                    {errors.content.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                Rating
                            </label>
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                     <button
                                        key={star}
                                        type="button"
                                        disabled={isReadOnly}
                                        onClick={() => setValue('rating', star)}
                                        className={`focus:outline-none transition-transform ${!isReadOnly ? 'active:scale-90' : 'cursor-not-allowed'}`}
                                    >
                                        {star <= currentRating ? (
                                            <StarIconSolid className="h-8 w-8 text-yellow-400" />
                                        ) : (
                                            <StarIconOutline className={`h-8 w-8 text-slate-300 ${!isReadOnly ? 'hover:text-yellow-400' : ''} transition-colors`} />
                                        )}
                                    </button>
                                ))}
                            </div>
                            <input type="hidden" {...register('rating')} />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                Client Image
                            </label>
                            <div
                                onClick={() => { if (!isReadOnly) setIsMediaOpen(true); }}
                                className={`aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 ${!isReadOnly ? 'hover:bg-slate-100/50 hover:border-blue-400 hover:text-blue-500 cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-all group overflow-hidden relative`}
                            >
                                {watch('clientPhoto') ? (
                                    <img src={watch('clientPhoto')} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <>
                                        <ArrowUpTrayIcon className="h-6 w-6 mb-1 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-bold">Select from Library</span>
                                    </>
                                )}
                            </div>
                            {watch('clientPhoto') && !isReadOnly && (
                                <button type="button" onClick={() => setValue('clientPhoto', '', { shouldDirty: true })} className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-widest transition-colors">
                                    Remove
                                </button>
                            )}
                            <MediaPickerModal
                                isOpen={isMediaOpen}
                                onClose={() => setIsMediaOpen(false)}
                                onSelect={(url) => { setValue('clientPhoto', url, { shouldDirty: true }); setIsMediaOpen(false); }}
                                current={watch('clientPhoto')}
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
                                    {isReadOnly ? 'Read Only Mode' : 'Update Testimonial'}
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
