import React from 'react';
import { useRouter } from 'next/navigation';
import { ExclamationTriangleIcon, SwatchIcon } from '@heroicons/react/24/outline';

export default function ThemeNotDetected() {
    const router = useRouter();

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-500">
            <div className="bg-white rounded-3xl p-10 max-w-lg w-full text-center shadow-2xl shadow-slate-200 border border-slate-100">
                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ExclamationTriangleIcon className="w-10 h-10 text-orange-500" />
                </div>

                <h2 className="text-2xl font-bold text-slate-900 font-display mb-3">
                    Theme Not Detected
                </h2>

                <p className="text-slate-500 leading-relaxed mb-8">
                    This page cannot be loaded because no active website theme was found in the system. Please upload a theme to generate the static and dynamic page structures.
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => router.push('/dashboard/settings')}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <SwatchIcon className="w-5 h-5" />
                        Upload Theme
                    </button>

                    <button
                        onClick={() => router.back()}
                        className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold transition-all active:scale-95"
                    >
                        Cancel & Go Back
                    </button>
                </div>
            </div>
        </div>
    );
}
