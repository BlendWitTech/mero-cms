import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';

interface AlertDialogProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'info' | 'success' | 'warning';
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function AlertDialog({
    isOpen,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'info',
    isLoading = false,
    onConfirm,
    onCancel,
    onSecondary,
    secondaryLabel
}: AlertDialogProps & { onSecondary?: () => void; secondaryLabel?: string }) {

    // ... (keep useEffect) ...

    if (!isOpen) return null;

    const content = (
        <div className="fixed inset-0 z-[50000] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onCancel}
            ></div>
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200 border border-slate-100 overflow-hidden">
                <div className="flex gap-4">
                    <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${variant === 'danger'
                        ? 'bg-red-50 text-red-600'
                        : variant === 'success'
                            ? 'bg-emerald-50 text-emerald-600'
                            : variant === 'warning'
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-blue-50 text-blue-600'
                        }`}>
                        {variant === 'danger' ? (
                            <ExclamationTriangleIcon className="h-6 w-6" />
                        ) : variant === 'success' ? (
                            <InformationCircleIcon className="h-6 w-6" /> // You might want CheckCircleIcon here if available
                        ) : variant === 'warning' ? (
                            <ExclamationTriangleIcon className="h-6 w-6" />
                        ) : (
                            <InformationCircleIcon className="h-6 w-6" />
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-black text-slate-900 mb-1">{title}</h3>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">{description}</p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="shrink-0 -mt-2 -mr-2 p-2 text-slate-400 hover:text-slate-900 transition-colors"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="mt-8 flex items-center justify-end gap-3 flex-wrap">
                    {/* Cancel Button */}
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {cancelLabel}
                    </button>

                    {/* Secondary Button (Discard) */}
                    {onSecondary && secondaryLabel && (
                        <button
                            onClick={onSecondary}
                            disabled={isLoading}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold text-red-600 bg-white border border-red-200 hover:bg-red-50 hover:border-red-300 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {secondaryLabel}
                        </button>
                    )}

                    {/* Primary Button (Confirm) */}
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variant === 'danger'
                            ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
                            : variant === 'success'
                                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
                            }`}
                    >
                        {isLoading && <LoadingSpinner size="sm" variant="white" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
}
