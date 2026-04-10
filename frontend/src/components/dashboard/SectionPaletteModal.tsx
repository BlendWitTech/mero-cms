'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { XMarkIcon, PlusIcon, SquaresPlusIcon } from '@heroicons/react/24/outline';

interface SectionPaletteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (section: any) => void;
}

export default function SectionPaletteModal({ isOpen, onClose, onSelect }: SectionPaletteModalProps) {
    const [palette, setPalette] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            apiRequest('/themes/active/section-palette')
                .then(res => setPalette(res || []))
                .catch(err => console.error('Failed to load palette:', err))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
            
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <SquaresPlusIcon className="w-6 h-6 text-red-600" />
                            Add Section
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Choose a section type from your theme's library.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar bg-white">
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-32 bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {palette.map((sec) => (
                                <button
                                    key={sec.type}
                                    onClick={() => onSelect(sec)}
                                    className="group p-5 text-left border-2 border-slate-100 rounded-2xl hover:border-red-500/30 hover:bg-red-50/30 transition-all flex flex-col justify-between h-40"
                                >
                                    <div>
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-red-100 transition-colors">
                                            <PlusIcon className="w-5 h-5 text-slate-500 group-hover:text-red-600" />
                                        </div>
                                        <h4 className="font-bold text-slate-800 text-sm">{sec.label}</h4>
                                        <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                                            {sec.description || `Add a ${sec.label} section to your page layout.`}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {!isLoading && palette.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-slate-400 text-sm italic">No section types found in the active theme schema.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
