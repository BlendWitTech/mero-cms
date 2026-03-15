'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    ArrowLeftIcon,
    CloudArrowUpIcon,
    StarIcon as StarIconOutline
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { useForm } from '@/context/FormContext';
import UnsavedChangesAlert from '@/components/ui/UnsavedChangesAlert';
import AlertDialog from '@/components/ui/AlertDialog';
import ThemeCompatibilityBanner, { useThemeCompatibility } from '@/components/ui/ThemeCompatibilityBanner';


interface Testimonial {
    id: string;
    clientName: string;
    clientRole: string;
    content: string;
    rating: number;
    image: string;
    updatedAt: string;
}

function TestimonialsPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { setIsDirty } = useForm();
    const { showToast } = useNotification();
    const { isSupported } = useThemeCompatibility('testimonials');


    // Derived state
    const view = searchParams.get('action') === 'new' || searchParams.get('action') === 'edit' ? 'editor' : 'list';
    const actionId = searchParams.get('id');

    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const defaultFormData = {
        clientName: '',
        clientRole: '',
        content: '',
        rating: 0,
        image: ''
    };

    const [formData, setFormData] = useState<any>(defaultFormData);
    const [initialState, setInitialState] = useState<any>(defaultFormData);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null
    });

    useEffect(() => {
        fetchTestimonials();
    }, []);

    useEffect(() => {
        const dirty = JSON.stringify(formData) !== JSON.stringify(initialState);
        setIsDirty(dirty);
    }, [formData, initialState, setIsDirty]);

    useEffect(() => {
        const action = searchParams.get('action');
        const id = searchParams.get('id');

        if (!isLoading) {
            if (action === 'new') {
                setFormData(defaultFormData);
                setInitialState(defaultFormData);
                setCurrentId(null);
            } else if (action === 'edit' && id) {
                const testimonial = testimonials.find(t => t.id === id);
                if (testimonial) {
                    const data = {
                        clientName: testimonial.clientName,
                        clientRole: testimonial.clientRole || '',
                        content: testimonial.content,
                        rating: testimonial.rating || 5,
                        image: testimonial.image || ''
                    };
                    setFormData(data);
                    setInitialState(data);
                    setCurrentId(id);
                }
            }
        }
    }, [searchParams, isLoading, testimonials]);

    const fetchTestimonials = async () => {
        try {
            setIsLoading(true);
            const data = await apiRequest('/testimonials');
            setTestimonials(data || []);
        } catch (error) {
            console.error('Failed to fetch testimonials:', error);
            showToast('Failed to load testimonials', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = () => {
        router.push('/dashboard/testimonials?action=new');
    };

    const handleEdit = (testimonial: Testimonial) => {
        router.push(`/dashboard/testimonials?action=edit&id=${testimonial.id}`);
    };

    const handleBack = () => {
        if (JSON.stringify(formData) !== JSON.stringify(initialState)) {
            setShowUnsavedAlert(true);
        } else {
            router.push('/dashboard/testimonials');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const url = currentId ? `/testimonials/${currentId}` : '/testimonials';
        const method = currentId ? 'PATCH' : 'POST';

        try {
            await apiRequest(url, {
                method,
                body: { ...formData, rating: Number(formData.rating) },
                skipNotification: true
            });

            showToast(`Testimonial ${currentId ? 'updated' : 'created'} successfully`, 'success');
            setIsDirty(false);
            router.push('/dashboard/testimonials');
            fetchTestimonials();
        } catch (error: any) {
            showToast(error.message || 'Failed to save testimonial', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (id: string) => {
        setDeleteConfirmation({ isOpen: true, id });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation.id) return;

        try {
            await apiRequest(`/testimonials/${deleteConfirmation.id}`, { method: 'DELETE' });
            showToast('Testimonial deleted successfully', 'success');
            fetchTestimonials();
            setDeleteConfirmation({ isOpen: false, id: null });
        } catch (error) {
            console.error('Failed to delete testimonial:', error);
            showToast('Failed to delete testimonial', 'error');
            setDeleteConfirmation({ isOpen: false, id: null });
        }
    };

    const cancelDelete = () => {
        setDeleteConfirmation({ isOpen: false, id: null });
    };

    if (view === 'editor') {
        return (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm hover:shadow-md"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
                            {currentId ? 'Edit Testimonial' : 'New Testimonial'}
                        </h1>
                        <p className="mt-1 text-xs text-slate-500 font-semibold tracking-tight">
                            {currentId ? 'Update client review.' : 'Add a new client review.'}
                        </p>
                    </div>
                </div>

                <ThemeCompatibilityBanner moduleName="testimonials" />

                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-slate-200/20 p-8">
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                        Client Name <span className="text-blue-500 font-bold">*</span>
                                    </label>
                                     <input
                                        type="text"
                                        required
                                        value={formData.clientName}
                                        disabled={!isSupported}
                                        onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium transition-all focus:border-blue-500 focus:ring-blue-500/10 disabled:opacity-50"
                                        placeholder="e.g. John Doe"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                        Client Role
                                    </label>
                                     <input
                                        type="text"
                                        value={formData.clientRole}
                                        disabled={!isSupported}
                                        onChange={(e) => setFormData({ ...formData, clientRole: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium transition-all focus:border-blue-500 focus:ring-blue-500/10 disabled:opacity-50"
                                        placeholder="e.g. CEO, Tech Corp"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                    Testimonial Content <span className="text-blue-500 font-bold">*</span>
                                </label>
                                 <textarea
                                    required
                                    value={formData.content}
                                    disabled={!isSupported}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    rows={4}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium transition-all focus:border-blue-500 focus:ring-blue-500/10 resize-none disabled:opacity-50"
                                    placeholder="What did they say?"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                    Rating
                                </label>
                                <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                                    {[1, 2, 3, 4, 5].map((star) => {
                                        // Determine which rating to show (hover or actual)
                                        const activeRating = hoverRating || formData.rating;

                                        return (
                                            <button
                                                key={star}
                                                type="button"
                                                disabled={!isSupported}
                                                onMouseMove={(e) => {
                                                    const { left, width } = e.currentTarget.getBoundingClientRect();
                                                    const percent = (e.clientX - left) / width;
                                                    const newRating = percent < 0.5 ? star - 0.5 : star;
                                                    setHoverRating(newRating);
                                                }}
                                                onClick={() => {
                                                    const finalRating = hoverRating || formData.rating;
                                                    setFormData({ ...formData, rating: finalRating });
                                                }}
                                                className="relative focus:outline-none transition-transform active:scale-95 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {/* Background Star (Outline) */}
                                                <StarIconOutline className="h-8 w-8 text-slate-300" />

                                                {/* Full Star Overlay */}
                                                <div
                                                    className={`absolute inset-0 p-1 overflow-hidden pointer-events-none transition-all duration-200 ${activeRating >= star ? 'w-full opacity-100' :
                                                        activeRating >= star - 0.5 ? 'w-[50%] opacity-100' : 'w-0 opacity-0'
                                                        }`}
                                                >
                                                    <StarIconSolid className={`h-8 w-8 text-yellow-400 min-w-[32px]`} />
                                                </div>
                                            </button>
                                        );
                                    })}
                                    <span className="ml-2 text-sm font-bold text-slate-500 w-8">
                                        {hoverRating || formData.rating || 0}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                    Client Image URL
                                </label>
                                 <input
                                    type="text"
                                    value={formData.image}
                                    disabled={!isSupported}
                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium transition-all focus:border-blue-500 focus:ring-blue-500/10 disabled:opacity-50"
                                    placeholder="https://..."
                                />
                                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-wide">Enter the URL of the image from your media library</p>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                             <button
                                type="submit"
                                disabled={isSaving || !isSupported}
                                className="inline-flex items-center gap-2 px-8 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <CloudArrowUpIcon className="h-5 w-5" strokeWidth={2} />
                                )}
                                <span>{!isSupported ? 'Unsupported by Theme' : (currentId ? 'Update Testimonial' : 'Create Testimonial')}</span>
                            </button>
                        </div>
                    </form>
                </div>

                <UnsavedChangesAlert
                    isOpen={showUnsavedAlert}
                    title="Unsaved Changes"
                    description="You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
                    confirmLabel="Save & Exit"
                    secondaryLabel="Discard & Leave"
                    cancelLabel="Keep Editing"
                    onSaveAndExit={async () => {
                        // Create synthetic event
                        const syntheticEvent = { preventDefault: () => { } } as React.FormEvent;
                        await handleSave(syntheticEvent);
                    }}
                    onDiscardAndExit={() => {
                        setIsDirty(false);
                        setShowUnsavedAlert(false);
                        router.push('/dashboard/testimonials');
                    }}
                    onCancel={() => setShowUnsavedAlert(false)}
                    variant="success"
                />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <AlertDialog
                isOpen={deleteConfirmation.isOpen}
                title="Delete Testimonial"
                description="Are you sure you want to delete this testimonial? This action cannot be undone."
                confirmLabel="Delete Testimonial"
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
                        Client <span className="text-blue-600">Testimonials</span>
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 font-semibold tracking-tight">
                        Manage customer reviews and feedback.
                    </p>
                </div>
                 <button
                    onClick={handleCreate}
                    disabled={!isSupported}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 shadow-lg shadow-emerald-600/30 text-white font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 hover:-translate-y-0.5 transition-all active:translate-y-0 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                    <PlusIcon className="h-4 w-4" />
                    New Testimonial
                </button>
            </div>

            <ThemeCompatibilityBanner moduleName="testimonials" />

            {/* List */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-slate-200/20 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 flex justify-center">
                        <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                ) : testimonials.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-slate-400 font-medium">No testimonials found. Create one to get started.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-full">Client</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rating</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {testimonials.map((testimonial) => (
                                    <tr key={testimonial.id} className="group hover:bg-blue-50/30 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 ring-2 ring-white shadow-sm">
                                                    {testimonial.image ? (
                                                        <img src={testimonial.image} alt={testimonial.clientName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-xs uppercase">
                                                            {testimonial.clientName.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{testimonial.clientName}</p>
                                                    <p className="text-xs text-slate-500">{testimonial.clientRole}</p>
                                                    <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic">"{testimonial.content}"</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex text-yellow-400">
                                                {[...Array(5)].map((_, i) => (
                                                    <StarIconSolid key={i} className={`h-4 w-4 ${i < testimonial.rating ? 'text-yellow-400' : 'text-slate-200'}`} />
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-xs font-semibold text-slate-500">
                                                {new Date(testimonial.updatedAt).toLocaleDateString()}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(testimonial)}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                >
                                                    <PencilSquareIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(testimonial.id)}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TestimonialsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        }>
            <TestimonialsPageContent />
        </Suspense>
    );
}
