'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    LockClosedIcon,
    EnvelopeIcon,
    UserIcon,
    EyeIcon,
    EyeSlashIcon,
    CheckCircleIcon,
    BuildingLibraryIcon,
} from '@heroicons/react/24/outline';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ModuleMeta {
    key: string;
    label: string;
    description: string;
    group: string;
    requiredTier: number;
}

const TIER_LABELS: Record<number, string> = {
    1: 'Basic',
    2: 'Premium',
    3: 'Enterprise',
    4: 'Custom',
};

type Step = 'welcome' | 'modules' | 'restarting' | 'complete';

export default function SetupPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('welcome');
    const [availableModules, setAvailableModules] = useState<ModuleMeta[]>([]);
    const [currentTier, setCurrentTier] = useState<number>(1);
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [restartAttempts, setRestartAttempts] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [currentBranch, setCurrentBranch] = useState<string>('');
    const [licenseKey, setLicenseKey] = useState<string>('');
    const [isVerifying, setIsVerifying] = useState(false);

    const [settings, setSettings] = useState({
        cms_title: 'Mero CMS',
        cms_subtitle: 'Elevate Your Content Strategy',
        cms_login_avatar: '/assets/boy_idea_shock.png',
    });

    const [siteName, setSiteName] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        fetch(`${API_URL}/settings`)
            .then((r) => r.json())
            .then((data) => { if (data.cms_title) setSettings(data); })
            .catch(() => { });

        fetch(`${API_URL}/setup/status`)
            .then((r) => r.json())
            .then((data) => { if (data.setupComplete) router.replace('/dashboard'); })
            .catch(() => { });

        fetch(`${API_URL}/setup/modules`)
            .then((r) => r.json())
            .then((data) => {
                const mods = data.optional || [];
                const tier = data.currentTier || 1;
                setAvailableModules(mods);
                setCurrentTier(tier);
                setCurrentBranch(data.branch || '');
                setSelectedModules(
                    mods
                        .filter((m: ModuleMeta) => (m.requiredTier || 1) <= tier)
                        .map((m: ModuleMeta) => m.key)
                );
            })
            .catch(() => { });
    }, [router]);

    const toggleModule = (key: string, requiredTier: number) => {
        if (requiredTier > currentTier) return;
        setSelectedModules((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    const handleWelcomeNext = () => {
        setError('');
        if (!siteName.trim()) return setError('Site name is required');
        if (!adminName.trim()) return setError('Admin name is required');
        if (!adminEmail.trim()) return setError('Admin email is required');
        if (!adminPassword) return setError('Password is required');
        if (adminPassword.length < 8) return setError('Password must be at least 8 characters');
        if (adminPassword !== confirmPassword) return setError('Passwords do not match');
        setStep('modules');
    };

    const handleVerifyLicense = async () => {
        if (!licenseKey.trim()) return setError('Please enter a license key');
        setIsVerifying(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/setup/verify-license`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ licenseKey }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Invalid license key');
            setCurrentTier(data.tier);
            setSelectedModules(availableModules.filter(m => (m.requiredTier || 1) <= data.tier).map(m => m.key));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleComplete = async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/setup/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    siteName,
                    adminName,
                    adminEmail,
                    adminPassword,
                    enabledModules: selectedModules,
                    licenseKey: licenseKey || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Setup failed');
            if (data.needsRestart) {
                setStep('restarting');
                pollForRestart();
            } else {
                setStep('complete');
                setTimeout(() => router.push('/'), 1500);
            }
        } catch (err: any) {
            setError(err.message || 'Setup failed. Please try again.');
            setIsLoading(false);
        }
    };

    const pollForRestart = () => {
        const MAX_ATTEMPTS = 30;
        let attempts = 0;
        const poll = async () => {
            attempts++;
            setRestartAttempts(attempts);
            try {
                const res = await fetch(`${API_URL}/setup/status`, { cache: 'no-store' });
                const data = await res.json();
                if (data.setupComplete) {
                    setStep('complete');
                    setTimeout(() => router.push('/'), 1500);
                    return;
                }
            } catch { }
            if (attempts < MAX_ATTEMPTS) {
                setTimeout(poll, 2000);
            } else {
                setStep('complete');
                setTimeout(() => router.push('/'), 1500);
            }
        };
        setTimeout(poll, 2000);
    };

    const modulesByGroup = Array.from(new Set(availableModules.map(m => m.group)))
        .map(group => ({ group, modules: availableModules.filter(m => m.group === group) }))
        .filter(g => g.modules.length > 0);

    const inputClass = "block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium";

    const STEPS: Step[] = ['welcome', 'modules', 'complete'];
    const stepIndex = STEPS.indexOf(step === 'restarting' ? 'modules' : step);

    return (
        <div className="min-h-screen flex font-sans">
            {/* ── Left brand panel ── */}
            <div className="hidden lg:flex lg:w-[42%] xl:w-[38%] flex-col items-center justify-center relative overflow-hidden bg-slate-900 text-white p-12">
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <div className="absolute top-[-80px] left-[-80px] w-[360px] h-[360px] rounded-full bg-blue-600/20 blur-[80px] pointer-events-none" />
                <div className="absolute bottom-[-60px] right-[-60px] w-[280px] h-[280px] rounded-full bg-indigo-600/15 blur-[60px] pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
                    <div className="w-28 h-28 rounded-2xl overflow-hidden mb-8 ring-4 ring-white/10 shadow-2xl">
                        <Image
                            src={settings.cms_login_avatar}
                            alt="CMS"
                            width={112}
                            height={112}
                            className="object-cover w-full h-full"
                            priority
                        />
                    </div>

                    <h1 className="text-3xl font-black tracking-tight mb-2">{settings.cms_title}</h1>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed mb-10">{settings.cms_subtitle}</p>

                    <div className="w-full space-y-3">
                        {[
                            { label: 'Site & Admin Setup', desc: 'Name your site and create the superadmin account' },
                            { label: 'Select Modules', desc: 'Choose the features matching your license' },
                            { label: 'Complete', desc: 'Your CMS will be ready to use' },
                        ].map((s, i) => (
                            <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl border transition-all ${i === stepIndex ? 'bg-blue-600/20 border-blue-500/40' : i < stepIndex ? 'bg-white/5 border-white/5' : 'bg-white/[0.03] border-white/[0.03]'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 ${i === stepIndex ? 'bg-blue-500 text-white' : i < stepIndex ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-500'}`}>
                                    {i < stepIndex ? '✓' : i + 1}
                                </div>
                                <div className="text-left">
                                    <p className={`text-sm font-bold ${i === stepIndex ? 'text-white' : i < stepIndex ? 'text-slate-300' : 'text-slate-600'}`}>{s.label}</p>
                                    <p className={`text-xs mt-0.5 ${i === stepIndex ? 'text-blue-300' : 'text-slate-600'}`}>{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {currentTier > 0 && (
                        <div className="mt-8 px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-full">
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{TIER_LABELS[currentTier] || 'Basic'} License</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Right form panel ── */}
            <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12 overflow-y-auto">
                <div className="flex lg:hidden items-center gap-3 mb-10">
                    <div className="w-10 h-10 rounded-xl overflow-hidden">
                        <Image src={settings.cms_login_avatar} alt="CMS" width={40} height={40} className="object-cover w-full h-full" />
                    </div>
                    <span className="text-lg font-black text-slate-900">{settings.cms_title}</span>
                </div>

                <div className="w-full max-w-md">

                    {/* ── Step 1: Site & Admin ── */}
                    {step === 'welcome' && (
                        <div className="space-y-5">
                            <div className="mb-7">
                                <h2 className="text-2xl font-black text-slate-900 mb-1">Initial Setup</h2>
                                <p className="text-sm text-slate-500 font-medium">Name your site and create your superadmin account.</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Site Name</label>
                                <div className="relative group">
                                    <BuildingLibraryIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="My Awesome Website" className={inputClass} />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Admin Name</label>
                                <div className="relative group">
                                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input type="text" value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="John Doe" className={inputClass} />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Admin Email</label>
                                <div className="relative group">
                                    <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@example.com" className={inputClass} />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                                <div className="relative group">
                                    <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input type={showPassword ? 'text' : 'password'} value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Min. 8 characters" className={`${inputClass} pr-11`} />
                                    <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                        {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm Password</label>
                                <div className="relative group">
                                    <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" className={`${inputClass} pr-11`} />
                                    <button type="button" tabIndex={-1} onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                        {showConfirm ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* License Key */}
                            <div className="space-y-1.5 pt-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">License Key <span className="normal-case font-normal text-slate-400">(optional — unlocks higher tiers)</span></label>
                                <div className="flex gap-2">
                                    <div className="relative group flex-1">
                                        <CheckCircleIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input type="text" value={licenseKey} onChange={(e) => setLicenseKey(e.target.value)} placeholder="Paste your JWT license key" className={inputClass} />
                                    </div>
                                    <button type="button" onClick={handleVerifyLicense} disabled={isVerifying} className="px-4 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl font-bold text-xs hover:bg-blue-100 transition-all disabled:opacity-50">
                                        {isVerifying ? '…' : 'Verify'}
                                    </button>
                                </div>
                                {currentTier > 1 && (
                                    <p className="text-[10px] text-emerald-600 font-semibold">✓ {TIER_LABELS[currentTier]} license active</p>
                                )}
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-red-600">{error}</div>
                            )}

                            <button onClick={handleWelcomeNext} className="w-full mt-2 bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-slate-900/20 hover:bg-blue-600 hover:shadow-blue-600/20 transition-all active:scale-[0.98]">
                                Next: Select Modules →
                            </button>
                        </div>
                    )}

                    {/* ── Step 2: Module Selection ── */}
                    {step === 'modules' && (
                        <div className="space-y-6">
                            <div className="mb-7">
                                <h2 className="text-2xl font-black text-slate-900 mb-1">Select Modules</h2>
                                <p className="text-sm text-slate-500 font-medium">
                                    Choose the features to enable.{currentTier < 3 && ' Some modules require a higher license tier.'}
                                </p>
                            </div>

                            <div className="space-y-5 max-h-[420px] overflow-y-auto pr-1">
                                {modulesByGroup.map(({ group, modules }) => (
                                    <div key={group}>
                                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{group}</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {modules.map((mod) => {
                                                const isSelected = selectedModules.includes(mod.key);
                                                const isLocked = (mod.requiredTier || 1) > currentTier;
                                                return (
                                                    <button
                                                        key={mod.key}
                                                        onClick={() => toggleModule(mod.key, mod.requiredTier)}
                                                        disabled={isLocked}
                                                        className={`text-left p-3.5 rounded-xl border-2 transition-all ${isLocked
                                                            ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed'
                                                            : isSelected
                                                                ? 'bg-blue-50 border-blue-400 shadow-sm shadow-blue-100'
                                                                : 'bg-white border-slate-200 hover:border-slate-300'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className={`text-xs font-bold ${isLocked ? 'text-slate-400' : isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{mod.label}</span>
                                                            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${isLocked ? 'bg-slate-200' : isSelected ? 'bg-blue-500' : 'bg-slate-100'}`}>
                                                                {isLocked ? (
                                                                    <svg className="w-2.5 h-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                                    </svg>
                                                                ) : isSelected ? <span className="text-white text-[9px] font-black">✓</span> : null}
                                                            </div>
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 leading-tight">
                                                            {isLocked ? `Requires ${TIER_LABELS[mod.requiredTier]} license` : mod.description}
                                                        </p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-red-600">{error}</div>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => setStep('welcome')} className="flex-1 py-3.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-xl transition-all">
                                    ← Back
                                </button>
                                <button onClick={handleComplete} disabled={isLoading} className="flex-1 py-3.5 bg-slate-900 text-white font-bold text-sm rounded-xl shadow-lg shadow-slate-900/20 hover:bg-blue-600 hover:shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none">
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Setting up...
                                        </span>
                                    ) : 'Complete Setup'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Restarting ── */}
                    {step === 'restarting' && (
                        <div className="text-center space-y-5 py-6">
                            <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto">
                                <span className="w-9 h-9 border-[3px] border-blue-200 border-t-blue-600 rounded-full animate-spin block" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 mb-2">Configuring Your CMS</h2>
                                <p className="text-sm text-slate-500 font-medium">Building database schema and restarting server...</p>
                                {restartAttempts > 0 && (
                                    <p className="text-xs text-slate-400 mt-2">Waiting for server ({restartAttempts * 2}s)...</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Complete ── */}
                    {step === 'complete' && (
                        <div className="text-center space-y-5 py-6">
                            <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto">
                                <CheckCircleIcon className="w-10 h-10 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 mb-2">Setup Complete!</h2>
                                <p className="text-sm text-slate-500 font-medium">Your CMS has been configured. Redirecting to login...</p>
                            </div>
                        </div>
                    )}
                </div>

                <p className="mt-12 text-[10px] font-semibold text-slate-300 tracking-widest uppercase">
                    {settings.cms_title} · Initial Setup
                </p>
            </div>
        </div>
    );
}
