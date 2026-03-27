'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    CheckCircleIcon,
    ExclamationCircleIcon,
    PaperAirplaneIcon
} from '@heroicons/react/24/outline';

interface DynamicFormProps {
    form: {
        id: string;
        name: string;
        fields: any[];
        settings?: {
            successMessage?: string;
            submitButtonText?: string;
            featuredImage?: string;
        };
    };
    apiUrl?: string;
}

export default function DynamicForm({ form, apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001' }: DynamicFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors }
    } = useForm();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setValue(fieldName, reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        setError(null);
        try {
            const response = await fetch(`${apiUrl}/submissions/${form.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Submission failed');
            }

            setIsSuccess(true);
            reset();
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2rem] text-center animate-in zoom-in duration-500">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm mx-auto mb-4">
                    <CheckCircleIcon className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Success!</h3>
                <p className="text-slate-600 font-medium mt-2">
                    {form.settings?.successMessage || 'Thank you! Your submission has been received.'}
                </p>
                <button
                    onClick={() => setIsSuccess(false)}
                    className="mt-6 text-emerald-600 font-bold text-sm uppercase tracking-widest hover:underline"
                >
                    Send another submission
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {form.settings?.featuredImage && (
                <div className="w-full h-48 rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-200 border border-slate-100 animate-in fade-in duration-1000">
                    <img src={form.settings.featuredImage} alt={form.name} className="w-full h-full object-cover" />
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-5">
                    {form.fields.map((field) => (
                        <div key={field.id} className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                {field.label}
                                {field.required && <span className="text-blue-500 font-bold">*</span>}
                            </label>

                            {field.type === 'textarea' ? (
                                <textarea
                                    {...register(field.label || field.id, { required: field.required })}
                                    placeholder={field.placeholder}
                                    rows={4}
                                    className={`w-full bg-slate-50 border-2 rounded-2xl px-5 py-4 text-sm font-medium transition-all ${errors[field.label || field.id]
                                        ? 'border-red-200 focus:border-red-500 focus:ring-red-500/10'
                                        : 'border-slate-100 focus:border-blue-500 focus:ring-blue-500/10'
                                        }`}
                                />
                            ) : field.type === 'select' ? (
                                <select
                                    {...register(field.label || field.id, { required: field.required })}
                                    className={`w-full bg-slate-50 border-2 rounded-2xl px-5 py-4 text-sm font-medium transition-all ${errors[field.label || field.id]
                                        ? 'border-red-200 focus:border-red-500 focus:ring-red-500/10'
                                        : 'border-slate-100 focus:border-blue-500 focus:ring-blue-500/10'
                                        }`}
                                >
                                    <option value="">{field.placeholder || '-- Select Option --'}</option>
                                    {field.options?.map((opt: string) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            ) : field.type === 'image' || field.type === 'file' ? (
                                <input
                                    type="file"
                                    accept={field.type === 'image' ? 'image/*' : '*/*'}
                                    onChange={(e) => handleFileChange(e, field.label || field.id)}
                                    required={field.required}
                                    className={`w-full bg-slate-50 border-2 border-dashed rounded-2xl px-5 py-8 text-xs font-bold text-slate-400 uppercase tracking-widest transition-all ${errors[field.label || field.id]
                                        ? 'border-red-200 bg-red-50/10'
                                        : 'border-slate-100 hover:border-blue-200 hover:bg-blue-50/10'
                                        }`}
                                />
                            ) : (
                                <input
                                    type={field.type}
                                    {...register(field.label || field.id, { required: field.required })}
                                    placeholder={field.placeholder}
                                    className={`w-full bg-slate-50 border-2 rounded-2xl px-5 py-4 text-sm font-medium transition-all ${errors[field.label || field.id]
                                        ? 'border-red-200 focus:border-red-500 focus:ring-red-500/10'
                                        : 'border-slate-100 focus:border-blue-500 focus:ring-blue-500/10'
                                        }`}
                                />
                            )}

                            {errors[field.label || field.id] && (
                                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1 flex items-center gap-1">
                                    <ExclamationCircleIcon className="h-3 w-3" />
                                    {field.label || 'This field'} is required
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 animate-in slide-in-from-top-2">
                        <ExclamationCircleIcon className="h-5 w-5 shrink-0" />
                        <p className="text-xs font-bold leading-relaxed">{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                    {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <>
                            {form.settings?.submitButtonText || 'Submit Entry'}
                            <PaperAirplaneIcon className="h-4 w-4 text-blue-400 -rotate-45" />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
