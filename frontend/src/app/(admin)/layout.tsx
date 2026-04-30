'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { clearAuthToken } from '@/lib/auth';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import HelpFAB from '@/components/ui/HelpFAB';
import NavigationProgress from '@/components/ui/NavigationProgress';
import { PermissionsProvider } from '@/context/PermissionsContext';
import { FormProvider } from '@/context/FormContext';
import { ModulesProvider } from '@/context/ModulesContext';
import { CapabilitiesProvider } from '@/context/CapabilitiesContext';
import PoweredByBadge from '@/components/ui/PoweredByBadge';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [revocationMessage, setRevocationMessage] = useState<string | null>(null);
    const pathname = usePathname();
    const isMediaPage = pathname?.includes('/media');
    const isSettingsPage = pathname?.includes('/settings');
    /** The visual editor takes over the entire viewport — sidebar,
        header, and page padding all get out of the way. The page's own
        component handles every pixel of the screen. We still wrap in
        the providers (capabilities / permissions / etc.) so the editor
        keeps its data plumbing. */
    const isFullscreen = pathname?.includes('/themes/visual-editor');

    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    useEffect(() => {
        const handleSessionRevoked = (event: any) => {
            setRevocationMessage(event.detail.message);
        };
        window.addEventListener('session-revoked', handleSessionRevoked);
        return () => window.removeEventListener('session-revoked', handleSessionRevoked);
    }, []);

    const finalizeLogout = () => {
        clearAuthToken();
        window.location.href = '/';
    };

    // Full-screen routes (visual editor) skip the entire admin shell —
    // no sidebar, no header, no padding. The page renders edge-to-edge.
    if (isFullscreen) {
        return (
            <ModulesProvider>
                <CapabilitiesProvider>
                    <PermissionsProvider>
                        <FormProvider>
                            <Suspense fallback={null}>
                                <NavigationProgress />
                            </Suspense>
                            {children}
                            <ConfirmationModal
                                isOpen={!!revocationMessage}
                                onClose={finalizeLogout}
                                title="Access Revoked"
                                message={revocationMessage || 'Your administrative access has been revoked by the system administrator. Logging out...'}
                                isAlert={true}
                                variant="danger"
                            />
                        </FormProvider>
                    </PermissionsProvider>
                </CapabilitiesProvider>
            </ModulesProvider>
        );
    }

    return (
        <ModulesProvider>
                <CapabilitiesProvider>
                <PermissionsProvider>
                    <FormProvider>
                        <div className="admin-shell min-h-screen bg-white dark:bg-background text-slate-900 dark:text-slate-300 selection:bg-blue-600/10 selection:text-blue-600 flex flex-col transition-colors duration-500">
                            {/* NavigationProgress uses useSearchParams to detect
                                search-param-only nav transitions; Next.js 16
                                requires that call to sit inside a Suspense
                                boundary so the rest of the page tree doesn't
                                bail out to CSR during static generation. */}
                            <Suspense fallback={null}>
                                <NavigationProgress />
                            </Suspense>
                            
                            {/* Decorative Background Mesh/Orbs */}
                            <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/[0.03] dark:bg-blue-500/[0.05] blur-[140px] rounded-full pointer-events-none transition-opacity duration-1000"></div>
                            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/[0.03] dark:bg-indigo-500/[0.05] blur-[140px] rounded-full pointer-events-none transition-opacity duration-1000"></div>
                            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-blue-600/[0.01] dark:bg-blue-400/[0.02] blur-[160px] rounded-full pointer-events-none transition-opacity duration-1000"></div>

                            {/* Sidebar - Desktop */}
                            <div className={`fixed inset-y-0 left-0 z-50 hidden lg:flex lg:flex-col min-h-0 transition-all duration-500 ease-in-out ${isCollapsed ? 'lg:w-20' : 'lg:w-80'}`}>
                                <Suspense fallback={<div className="w-full h-full bg-white dark:bg-[#0d1117] animate-pulse" />}>
                                    <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
                                </Suspense>
                            </div>



                            {/* Mobile Sidebar Overlay */}
                            {isMobileOpen && (
                                <div
                                    className="fixed inset-0 z-50 lg:hidden"
                                    onClick={() => setIsMobileOpen(false)}
                                >
                                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                                    <div
                                        className="absolute inset-y-0 left-0 w-80 max-w-[85vw] flex flex-col"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Suspense fallback={null}>
                                            <Sidebar isCollapsed={false} onToggle={() => setIsMobileOpen(false)} />
                                        </Suspense>
                                    </div>
                                </div>
                            )}

                            {/* Main Content Area */}
                            <div className={`relative flex h-screen flex-col overflow-hidden transition-all duration-500 ease-in-out ${isCollapsed ? 'lg:pl-20' : 'lg:pl-80'}`}>
                                <Header isCollapsed={isCollapsed} onMobileMenuToggle={() => setIsMobileOpen(true)} />
                                
                                <main className={`flex-1 overflow-x-hidden ${isSettingsPage ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'}`}>
                                    <div className={`relative ${isSettingsPage ? 'h-full overflow-y-auto custom-scrollbar' : ''} ${isMediaPage ? '' : 'p-4 sm:p-8 lg:p-10'}`}>
                                        <div className="relative z-10 max-w-7xl mx-auto">
                                            {children}
                                        </div>
                                        {/* Admin shell attribution — hidden for white-label tiers */}
                                        {!isSettingsPage && !isMediaPage && (
                                            <div className="relative z-10 max-w-7xl mx-auto mt-10 mb-2 flex justify-center">
                                                <PoweredByBadge />
                                            </div>
                                        )}
                                    </div>
                                </main>
                            </div>

                            <HelpFAB />

                            <ConfirmationModal
                                isOpen={!!revocationMessage}
                                onClose={finalizeLogout}
                                title="Access Revoked"
                                message={revocationMessage || 'Your administrative access has been revoked by the system administrator. Logging out...'}
                                isAlert={true}
                                variant="danger"
                            />
                        </div>
                    </FormProvider>
                </PermissionsProvider>
                </CapabilitiesProvider>
            </ModulesProvider>
    );
}
