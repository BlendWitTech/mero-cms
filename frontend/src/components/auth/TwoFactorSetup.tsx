import React, { useState } from 'react';
import {
    XMarkIcon,
    ShieldCheckIcon,
    QrCodeIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';

interface TwoFactorSetupProps {
    isOpen: boolean;
    onClose: () => void;
    onVerify: (token: string) => Promise<boolean>;
}

export default function TwoFactorSetup({ isOpen, onClose, onVerify }: TwoFactorSetupProps) {
    const [step, setStep] = useState<'generate' | 'verify'>('generate');
    const [qrCode, setQrCode] = useState('');
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const data = await apiRequest('/auth/2fa/generate');
            setQrCode(data.qrCode);
            setStep('verify');
        } catch (err) {
            setError('Failed to generate QR code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async () => {
        setIsLoading(true);
        setError('');
        const success = await onVerify(token);
        if (success) {
            onClose();
        } else {
            setError('Invalid token. Please try again.');
        }
        setIsLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 overflow-hidden animate-in zoom-in-95 duration-300">
                <button onClick={onClose} className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 transition-colors">
                    <XMarkIcon className="h-5 w-5 text-slate-400" />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6">
                        <ShieldCheckIcon className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 font-display">Two-Factor Security</h2>
                    <p className="mt-2 text-sm text-slate-500 font-medium px-4">
                        Protect your account with high-security TOTP authentication.
                    </p>

                    {step === 'generate' ? (
                        <div className="mt-8 w-full">
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <QrCodeIcon className="h-5 w-5" />}
                                Generate Secure QR Code
                            </button>
                        </div>
                    ) : (
                        <div className="mt-8 w-full space-y-6">
                            <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 inline-block mx-auto">
                                <img src={qrCode} alt="2FA QR Code" className="h-48 w-48" />
                            </div>

                            <div className="space-y-4">
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Enter Verification Code</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="000000"
                                    className="w-full text-center text-3xl font-black tracking-[0.5em] py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                                {error && <p className="text-xs font-bold text-red-500">{error}</p>}
                                <button
                                    onClick={handleVerify}
                                    disabled={isLoading || token.length < 6}
                                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                                >
                                    Verify & Activate
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
