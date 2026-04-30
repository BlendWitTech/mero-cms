'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useNotification } from '@/context/NotificationContext';
import {
    LockClosedIcon,
    EnvelopeIcon,
    UserIcon,
    EyeIcon,
    EyeSlashIcon,
    CheckCircleIcon,
    BuildingLibraryIcon,
} from '@heroicons/react/24/outline';

import { getApiBaseUrl } from '@/lib/api';
import IntegrationsStep from './IntegrationsStep';
// Use the shared ProgressTerminal so the wizard and admin Danger Zone
// render exactly the same panel — single source of truth for the
// streaming UX, no drift between the two surfaces.
import ProgressTerminal from '@/components/admin/ProgressTerminal';

const API_URL = getApiBaseUrl();

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

type Step = 'welcome' | 'database' | 'integrations' | 'modules' | 'restarting' | 'complete';

interface DbFormState {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl: boolean;
}

interface DbTestResult {
    success: boolean;
    error?: string;
}

interface DbStatus {
    configured: boolean;
    source: 'env' | 'setup.json' | 'unset';
    managedByEnv: boolean;
}

export default function SetupPage() {
    const router = useRouter();
    const { showToast } = useNotification();
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

    // Database step state. Defaults to a local Postgres install on the
    // standard port — most self-hosters run the DB on the same box, so
    // this gets them through the wizard with one form submission.
    const [dbForm, setDbForm] = useState<DbFormState>({
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: '',
        database: 'mero',
        ssl: false,
    });
    const [isTestingDb, setIsTestingDb] = useState(false);
    const [dbTestResult, setDbTestResult] = useState<DbTestResult | null>(null);
    const [isSavingDb, setIsSavingDb] = useState(false);
    // Captured from /setup/status. When `managedByEnv` is true we hide
    // the DB step entirely — env wins, the wizard would only confuse
    // the customer by collecting credentials it isn't allowed to use.
    const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);

    useEffect(() => {
        fetch(`${API_URL}/settings`)
            .then((r) => r.json())
            .then((data) => { if (data.cms_title) setSettings(data); })
            .catch(() => { });

        fetch(`${API_URL}/setup/status`)
            .then((r) => r.json())
            .then((data) => {
                if (data.setupComplete) {
                    router.replace('/dashboard');
                    return;
                }
                if (data.database) setDbStatus(data.database as DbStatus);
            })
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

    // True when the backend reported DATABASE_URL is environment-driven
    // (Docker, Railway, .env). In that case the wizard's database step
    // is redundant — it would only collect inputs the backend refuses
    // to apply. We skip directly from welcome to modules.
    const skipDbStep = !!dbStatus?.managedByEnv;

    const handleWelcomeNext = () => {
        setError('');
        if (!siteName.trim()) return setError('Site name is required');
        if (!adminName.trim()) return setError('Admin name is required');
        if (!adminEmail.trim()) return setError('Admin email is required');
        if (!adminPassword) return setError('Password is required');
        if (adminPassword.length < 8) return setError('Password must be at least 8 characters');
        if (adminPassword !== confirmPassword) return setError('Passwords do not match');
        // Skip DB step entirely when env-managed; otherwise go through it
        // first. Either way, the next stop after that is the bundled
        // Integrations step (site URL / email / storage).
        setStep(skipDbStep ? 'integrations' : 'database');
    };

    /**
     * Test the DB connection without persisting it. Calls /setup/database/test
     * which spins up a temporary PrismaClient and runs SELECT 1. We display
     * success/failure inline so the user can fix credentials before saving.
     */
    const handleTestDb = async () => {
        setError('');
        setDbTestResult(null);
        if (!dbForm.host.trim() || !dbForm.username.trim() || !dbForm.database.trim()) {
            setError('Host, username, and database are required');
            return;
        }
        setIsTestingDb(true);
        try {
            const res = await fetch(`${API_URL}/setup/database/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dbForm),
            });
            const data = await res.json();
            setDbTestResult({ success: !!data.success, error: data.error });
            if (data.success) {
                showToast('Database connection successful.', 'success');
            } else {
                showToast(data.error || 'Could not connect.', 'error');
            }
        } catch (err: any) {
            setDbTestResult({ success: false, error: err?.message || 'Network error' });
        } finally {
            setIsTestingDb(false);
        }
    };

    /**
     * Save the DB config (writes setup.json + .env) and run migrations.
     * Advances to the modules step on success. On failure, the user stays
     * here and can retry.
     */
    const handleSaveDb = async () => {
        setError('');
        if (!dbTestResult?.success) {
            setError('Test the connection successfully before saving.');
            return;
        }
        setIsSavingDb(true);
        try {
            const res = await fetch(`${API_URL}/setup/database/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...dbForm, runMigrations: true }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || data.message || 'Save failed');
            }
            if (data.error) {
                // Saved but migrations failed — let the user decide whether to continue.
                showToast(data.error, 'warning');
            } else {
                showToast('Database saved and migrations applied.', 'success');
            }
            setStep('integrations');
        } catch (err: any) {
            setError(err?.message || 'Could not save database config');
        } finally {
            setIsSavingDb(false);
        }
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
            if (!res.ok) {
                showToast(data.message || 'Invalid license key', 'error');
                throw new Error(data.message || 'Invalid license key');
            }
            setCurrentTier(data.tier);
            showToast(`${TIER_LABELS[data.tier]} License Verified Successfully!`, 'success');
            setSelectedModules(availableModules.filter(m => (m.requiredTier || 1) <= data.tier).map(m => m.key));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsVerifying(false);
        }
    };

    /**
     * Two-step kick-off so the streaming terminal in the 'restarting'
     * step is mounted (and its EventSource connected) before the
     * backend starts pushing progress events. Without the wait, fast
     * machines can blow past the 'started: setup' event before the
     * UI has subscribed to the SSE stream.
     *
     * 1. handleComplete() flips to 'restarting' — terminal mounts and opens SSE.
     * 2. SetupTerminal.onConnected → fireSetupComplete() POSTs /setup/complete.
     * 3. Backend streams progress events → terminal renders them.
     * 4. SetupTerminal sees the final 'setup/completed' event → onSetupComplete.
     */
    const fireSetupComplete = async () => {
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
                pollForRestart();
            } else {
                // Hold on the terminal for ~1.5s so the user sees the
                // last green checkmark before we redirect.
                setTimeout(() => {
                    setStep('complete');
                    setTimeout(() => router.push('/'), 1500);
                }, 1500);
            }
        } catch (err: any) {
            setError(err.message || 'Setup failed. Please try again.');
            // Bounce back to the modules step so the user can fix and retry.
            setStep('modules');
            setIsLoading(false);
        }
    };

    // Guards against double-fire when SSE reconnects.
    const setupFiredRef = useRef(false);
    const handleSseConnected = () => {
        if (setupFiredRef.current) return;
        setupFiredRef.current = true;
        fireSetupComplete();
    };

    const handleComplete = () => {
        setError('');
        setIsLoading(true);
        setupFiredRef.current = false;
        // Switch step first; SetupTerminal mounts, opens SSE, then calls
        // back via onConnected → handleSseConnected → fireSetupComplete.
        setStep('restarting');
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

    // Sidebar step list — hide the Database row when env owns DATABASE_URL.
    // 'integrations' is always shown (it bundles site URL / email / storage,
    // none of which are env-driven by default).
    const STEPS: Step[] = skipDbStep
        ? ['welcome', 'integrations', 'modules', 'complete']
        : ['welcome', 'database', 'integrations', 'modules', 'complete'];
    const stepIndex = STEPS.indexOf(step === 'restarting' ? 'modules' : step);

    return (
        <div className="min-h-screen flex font-sans">
            {/* ── Left brand panel ──────────────────────────────────
                Warm cream-tinted background with strong brand-coloured
                gradient orbs (red, navy, amber). Real visual difference
                from the white form panel on the right while keeping
                the Mero logo legible in its natural colours. */}
            <div className="hidden lg:flex lg:w-[42%] xl:w-[38%] flex-col items-center justify-center relative overflow-hidden text-slate-900 p-12 bg-gradient-to-br from-[#f5ecd7] via-[#efe4c7] to-[#f9f1de]">
                <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(13,14,20,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(13,14,20,0.6) 1px, transparent 1px)', backgroundSize: '56px 56px' }} />
                <div className="absolute top-[-140px] left-[-140px] w-[480px] h-[480px] rounded-full bg-[#cb172b]/30 blur-[110px] pointer-events-none" />
                <div className="absolute bottom-[-120px] right-[-120px] w-[400px] h-[400px] rounded-full bg-[#023d91]/22 blur-[100px] pointer-events-none" />
                <div className="absolute top-[35%] right-[-160px] w-[280px] h-[280px] rounded-full bg-amber-300/40 blur-[100px] pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
                    {/* Big Mero wordmark logo — natural red+dark colours
                        on the warm cream background. No duplicate "Mero
                        CMS" text underneath; the logo IS the brand. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/logo.svg"
                        alt="Mero CMS"
                        className="h-24 w-auto mb-14 select-none drop-shadow-sm"
                    />

                    <div className="w-full space-y-3">
                        {([
                            { label: 'Site & Admin Setup', desc: 'Name your site and create the superadmin account' },
                            !skipDbStep
                                ? { label: 'Database', desc: 'Connect to PostgreSQL and run migrations' }
                                : null,
                            { label: 'Site Configuration', desc: 'URL, email, and storage' },
                            { label: 'License & Modules', desc: 'Verify your license and choose features' },
                            { label: 'Complete', desc: 'Your CMS will be ready to use' },
                        ].filter(Boolean) as { label: string; desc: string }[]).map((s, i) => (
                            <div
                                key={i}
                                className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm transition-all ${
                                    i === stepIndex
                                        ? 'bg-white/80 border-blue-200 shadow-sm'
                                        : i < stepIndex
                                            ? 'bg-white/50 border-emerald-100'
                                            : 'bg-white/30 border-white/40'
                                }`}
                            >
                                <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 ${
                                        i === stepIndex
                                            ? 'bg-blue-600 text-white'
                                            : i < stepIndex
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-slate-300 text-white'
                                    }`}
                                >
                                    {i < stepIndex ? '✓' : i + 1}
                                </div>
                                <div className="text-left">
                                    <p
                                        className={`text-sm font-bold ${
                                            i === stepIndex
                                                ? 'text-slate-900'
                                                : i < stepIndex
                                                    ? 'text-slate-700'
                                                    : 'text-slate-500'
                                        }`}
                                    >
                                        {s.label}
                                    </p>
                                    <p
                                        className={`text-xs mt-0.5 ${
                                            i === stepIndex
                                                ? 'text-blue-700'
                                                : 'text-slate-500'
                                        }`}
                                    >
                                        {s.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {currentTier > 0 && (
                        <div className="mt-8 px-4 py-2 bg-white/70 backdrop-blur-sm border border-blue-200 rounded-full">
                            <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">
                                {TIER_LABELS[currentTier] || 'Basic'} License
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Right form panel ── */}
            <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12 overflow-y-auto">
                {/* Mobile-only brand mark — same Mero logo, no text. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/logo.svg"
                    alt="Mero CMS"
                    className="lg:hidden h-12 w-auto mb-10 select-none"
                />

                {/* Form column — narrows for compact forms, widens for
                    the streaming terminal so log lines don't wrap. */}
                <div className={`w-full ${step === 'restarting' ? 'max-w-2xl' : 'max-w-md'}`}>

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

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-red-600">{error}</div>
                            )}

                            {/* When DATABASE_URL is environment-managed,
                                we skip the database step entirely and
                                jump straight to site configuration. */}
                            {skipDbStep && dbStatus && (
                                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-[11px] font-semibold text-emerald-700">
                                    <span className="font-black">✓ Database detected.</span>{' '}
                                    <span className="font-medium">DATABASE_URL is configured via environment — we'll use it as-is and skip the database step.</span>
                                </div>
                            )}
                            <button onClick={handleWelcomeNext} className="w-full mt-2 bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-slate-900/20 hover:bg-blue-600 hover:shadow-blue-600/20 transition-all active:scale-[0.98]">
                                {skipDbStep ? 'Next: Site Configuration →' : 'Next: Configure Database →'}
                            </button>
                        </div>
                    )}

                    {/* ── Step 2: Database Connection ──────────────────
                        Replaces the previous "edit .env yourself" step.
                        Customer enters connection details, hits Test
                        Connection, then Save & Migrate which writes to
                        setup.json + .env and runs prisma migrate deploy. */}
                    {step === 'database' && (
                        <div className="space-y-6">
                            <div className="mb-7">
                                <h2 className="text-2xl font-black text-slate-900 mb-1">Database</h2>
                                <p className="text-sm text-slate-500 font-medium">
                                    Connect to your PostgreSQL database. The database must already exist — Mero won't create it for you. We'll test the connection, save it to <code className="font-mono text-xs px-1 py-0.5 rounded bg-slate-100">setup.json</code>, and run migrations.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <label className="block col-span-2">
                                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-1.5 block">Host</span>
                                    <input
                                        type="text"
                                        value={dbForm.host}
                                        onChange={e => { setDbForm(s => ({ ...s, host: e.target.value })); setDbTestResult(null); }}
                                        placeholder="localhost or db.example.com"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-1.5 block">Port</span>
                                    <input
                                        type="number"
                                        value={dbForm.port}
                                        onChange={e => { setDbForm(s => ({ ...s, port: Number(e.target.value) || 5432 })); setDbTestResult(null); }}
                                        placeholder="5432"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-1.5 block">Database name</span>
                                    <input
                                        type="text"
                                        value={dbForm.database}
                                        onChange={e => { setDbForm(s => ({ ...s, database: e.target.value })); setDbTestResult(null); }}
                                        placeholder="mero"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-1.5 block">Username</span>
                                    <input
                                        type="text"
                                        value={dbForm.username}
                                        onChange={e => { setDbForm(s => ({ ...s, username: e.target.value })); setDbTestResult(null); }}
                                        placeholder="postgres"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-1.5 block">Password</span>
                                    <input
                                        type="password"
                                        value={dbForm.password}
                                        onChange={e => { setDbForm(s => ({ ...s, password: e.target.value })); setDbTestResult(null); }}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                                    />
                                </label>
                                <label className="col-span-2 flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={dbForm.ssl}
                                        onChange={e => { setDbForm(s => ({ ...s, ssl: e.target.checked })); setDbTestResult(null); }}
                                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div>
                                        <span className="text-sm font-bold text-slate-900 block">Require SSL</span>
                                        <span className="text-xs text-slate-500">Turn this on if your provider requires it (typical for cloud DBs).</span>
                                    </div>
                                </label>
                            </div>

                            {/* Test result banner. */}
                            {dbTestResult && (
                                <div
                                    className={`p-4 rounded-xl text-sm font-semibold ${
                                        dbTestResult.success
                                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                            : 'bg-red-50 border border-red-200 text-red-700'
                                    }`}
                                >
                                    {dbTestResult.success ? (
                                        <>
                                            <span className="font-black">✓ Connection successful.</span>{' '}
                                            <span className="font-medium">Click "Save &amp; migrate" to write the configuration and create tables.</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="font-black">✗ Connection failed.</span>{' '}
                                            <span className="font-medium">{dbTestResult.error}</span>
                                        </>
                                    )}
                                </div>
                            )}

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-red-600">{error}</div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setStep('welcome')}
                                    disabled={isTestingDb || isSavingDb}
                                    className="px-6 py-3.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-xl transition-all disabled:opacity-50"
                                >
                                    ← Back
                                </button>
                                <button
                                    onClick={handleTestDb}
                                    disabled={isTestingDb || isSavingDb}
                                    className="flex-1 py-3.5 bg-white border-2 border-slate-300 hover:border-blue-500 hover:text-blue-600 text-slate-700 font-bold text-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isTestingDb ? 'Testing…' : 'Test connection'}
                                </button>
                                <button
                                    onClick={handleSaveDb}
                                    disabled={!dbTestResult?.success || isSavingDb || isTestingDb}
                                    className="flex-1 py-3.5 bg-slate-900 text-white font-bold text-sm rounded-xl shadow-lg shadow-slate-900/20 hover:bg-blue-600 hover:shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-900"
                                >
                                    {isSavingDb ? 'Saving…' : 'Save & migrate →'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 3: Site Configuration (site URL + email + storage)
                        All three sections are bundled here so the wizard
                        stays at 5 visual steps instead of 7. Self-hosters
                        on a single box typically just hit Continue. */}
                    {step === 'integrations' && (
                        <IntegrationsStep
                            apiUrl={API_URL}
                            onContinue={() => setStep('modules')}
                            onBack={() => setStep(skipDbStep ? 'welcome' : 'database')}
                            showToast={showToast}
                        />
                    )}

                    {/* ── Step 4: License + Module Selection ── */}
                    {step === 'modules' && (
                        <div className="space-y-6">
                            <div className="mb-7">
                                <h2 className="text-2xl font-black text-slate-900 mb-1">License & Modules</h2>
                                <p className="text-sm text-slate-500 font-medium">
                                    Enter your license key (optional), then choose the features to enable.
                                </p>
                            </div>

                            {/* License Key */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">License Key <span className="normal-case font-normal text-slate-400">(optional — unlocks higher tiers)</span></label>
                                <div className="flex gap-2">
                                    <div className="relative group flex-1">
                                        <CheckCircleIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input type="text" value={licenseKey} onChange={(e) => setLicenseKey(e.target.value)} placeholder="Paste your license key" className={inputClass} />
                                    </div>
                                    <button type="button" onClick={handleVerifyLicense} disabled={isVerifying} className="px-4 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl font-bold text-xs hover:bg-blue-100 transition-all disabled:opacity-50">
                                        {isVerifying ? '…' : 'Verify'}
                                    </button>
                                </div>
                                {currentTier > 1 && (
                                    <p className="text-[10px] text-emerald-600 font-semibold">✓ {TIER_LABELS[currentTier]} license active — additional modules unlocked</p>
                                )}
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
                                {/* Back goes to the immediately preceding
                                    step in the (possibly DB-skipped) flow. */}
                                <button onClick={() => setStep('integrations')} className="flex-1 py-3.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-xl transition-all">
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

                    {/* ── Restarting — live setup terminal ──
                        SetupTerminal opens an EventSource against the
                        backend's /setup/progress endpoint and renders
                        each event as a monospace line. onConnected
                        fires when the SSE channel is open; we use that
                        signal to actually trigger the POST so no early
                        events are lost on fast machines. */}
                    {step === 'restarting' && (
                        <div className="space-y-4 py-2">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 mb-1">Configuring Your CMS</h2>
                                <p className="text-sm text-slate-500 font-medium">
                                    Building schema, applying migrations, and seeding your install. Live progress below.
                                </p>
                            </div>

                            <ProgressTerminal
                                streamUrl={`${API_URL}/setup/progress`}
                                active={step === 'restarting'}
                                title="mero-cms › setup"
                                completionStage="setup"
                                onConnected={handleSseConnected}
                                onFailed={(ev) => {
                                    setError(ev.detail || ev.message || 'Setup failed.');
                                }}
                            />

                            {restartAttempts > 0 && (
                                <p className="text-[11px] text-slate-400 text-center font-mono">
                                    Waiting for server to come back online ({restartAttempts * 2}s)…
                                </p>
                            )}

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-red-600">{error}</div>
                            )}
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
                    Initial Setup
                </p>
            </div>
        </div>
    );
}
