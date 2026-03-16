'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ModuleMeta {
    key: string;
    label: string;
    description: string;
    group: string;
}

const MODULE_GROUPS = ['Content', 'Marketing', 'Site', 'SEO & Analytics'];

type Step = 'welcome' | 'modules' | 'restarting' | 'complete';

export default function SetupPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('welcome');
    const [availableModules, setAvailableModules] = useState<ModuleMeta[]>([]);
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [restartAttempts, setRestartAttempts] = useState(0);

    // Form fields
    const [siteName, setSiteName] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        // Redirect to dashboard if setup already complete
        fetch(`${API_URL}/setup/status`)
            .then((r) => r.json())
            .then((data) => {
                if (data.setupComplete) router.replace('/dashboard');
            })
            .catch(() => { });

        // Load available modules
        fetch(`${API_URL}/setup/modules`)
            .then((r) => r.json())
            .then((data) => {
                setAvailableModules(data.optional || []);
                // Select all by default
                setSelectedModules((data.optional || []).map((m: ModuleMeta) => m.key));
            })
            .catch(() => { });
    }, [router]);

    const toggleModule = (key: string) => {
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
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Setup failed');

            if (data.needsRestart) {
                // Server will restart — switch to polling step
                setStep('restarting');
                pollForRestart();
            } else {
                // No restart needed (e.g. Railway/Docker non-selective mode)
                setStep('complete');
                setTimeout(() => router.push('/'), 1500);
            }
        } catch (err: any) {
            setError(err.message || 'Setup failed. Please try again.');
            setIsLoading(false);
        }
    };

    const pollForRestart = () => {
        const MAX_ATTEMPTS = 30; // 30 × 2s = 60s timeout
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
            } catch {
                // Server still restarting — keep polling
            }

            if (attempts < MAX_ATTEMPTS) {
                setTimeout(poll, 2000);
            } else {
                // Timeout — redirect anyway
                setStep('complete');
                setTimeout(() => router.push('/'), 1500);
            }
        };

        // Wait 2s before first poll (server needs time to begin restart)
        setTimeout(poll, 2000);
    };

    const modulesByGroup = MODULE_GROUPS.map((group) => ({
        group,
        modules: availableModules.filter((m) => m.group === group),
    })).filter((g) => g.modules.length > 0);

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white">Setup Your CMS</h1>
                    <p className="text-gray-400 mt-2">Configure your CMS in a few steps</p>
                </div>

                {/* Progress */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    {(['welcome', 'modules', 'complete'] as Step[]).map((s, i) => (
                        <div key={s} className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step === s
                                ? 'bg-blue-600 text-white'
                                : (['welcome', 'modules', 'complete'].indexOf(step) > i)
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-800 text-gray-400'
                                }`}>
                                {i + 1}
                            </div>
                            {i < 2 && <div className="w-12 h-px bg-gray-700" />}
                        </div>
                    ))}
                </div>

                <div className="bg-gray-900 rounded-xl border border-gray-800 p-8">

                    {/* Step 1: Welcome */}
                    {step === 'welcome' && (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-xl font-semibold text-white mb-1">Site Information</h2>
                                <p className="text-sm text-gray-400">Set your site name and create the admin account.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Site Name</label>
                                <input
                                    type="text"
                                    value={siteName}
                                    onChange={(e) => setSiteName(e.target.value)}
                                    placeholder="My Awesome Website"
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Admin Name</label>
                                    <input
                                        type="text"
                                        value={adminName}
                                        onChange={(e) => setAdminName(e.target.value)}
                                        placeholder="John Doe"
                                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Admin Email</label>
                                    <input
                                        type="email"
                                        value={adminEmail}
                                        onChange={(e) => setAdminEmail(e.target.value)}
                                        placeholder="admin@example.com"
                                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                                    <input
                                        type="password"
                                        value={adminPassword}
                                        onChange={(e) => setAdminPassword(e.target.value)}
                                        placeholder="Min. 8 characters"
                                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repeat password"
                                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {error && <p className="text-red-400 text-sm">{error}</p>}

                            <button
                                onClick={handleWelcomeNext}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                            >
                                Next: Select Modules →
                            </button>
                        </div>
                    )}

                    {/* Step 2: Module Selection */}
                    {step === 'modules' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-semibold text-white mb-1">Select Modules</h2>
                                <p className="text-sm text-gray-400">
                                    Choose which features to enable. You can change this later in Settings.
                                </p>
                            </div>

                            <div className="space-y-5 max-h-96 overflow-y-auto pr-1">
                                {modulesByGroup.map(({ group, modules }) => (
                                    <div key={group}>
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                            {group}
                                        </h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {modules.map((mod) => {
                                                const isSelected = selectedModules.includes(mod.key);
                                                return (
                                                    <button
                                                        key={mod.key}
                                                        onClick={() => toggleModule(mod.key)}
                                                        className={`text-left p-3 rounded-lg border transition-all ${isSelected
                                                            ? 'bg-blue-600/20 border-blue-500 text-white'
                                                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <span className="text-sm font-medium">{mod.label}</span>
                                                            <span className={`w-4 h-4 rounded flex items-center justify-center text-xs ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-500'}`}>
                                                                {isSelected ? '✓' : ''}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 leading-tight">{mod.description}</p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setStep('welcome')}
                                    className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-lg transition-colors"
                                >
                                    ← Back
                                </button>
                                <button
                                    onClick={handleComplete}
                                    disabled={isLoading}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
                                >
                                    {isLoading ? 'Setting up...' : 'Complete Setup'}
                                </button>
                            </div>

                            {error && <p className="text-red-400 text-sm">{error}</p>}
                        </div>
                    )}

                    {/* Step 3: Restarting */}
                    {step === 'restarting' && (
                        <div className="text-center space-y-5 py-8">
                            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto">
                                <svg className="w-8 h-8 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-white">Setting Up Your CMS</h2>
                            <p className="text-gray-400 text-sm">
                                Building database schema and restarting server...
                            </p>
                            <p className="text-gray-600 text-xs">
                                {restartAttempts > 0 && `Waiting for server (${restartAttempts * 2}s)...`}
                            </p>
                        </div>
                    )}

                    {/* Step 4: Complete */}
                    {step === 'complete' && (
                        <div className="text-center space-y-4 py-8">
                            <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto">
                                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white">Setup Complete!</h2>
                            <p className="text-gray-400">Your CMS has been configured. Redirecting to login...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
