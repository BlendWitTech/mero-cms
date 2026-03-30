'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { clearAuthToken } from '@/lib/auth';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import HelpFAB from '@/components/ui/HelpFAB';
import { PermissionsProvider } from '@/context/PermissionsContext';
import { FormProvider } from '@/context/FormContext';
import { ModulesProvider } from '@/context/ModulesContext';

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

    // Close mobile sidebar on route change
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

    return (
        <ModulesProvider>
        <PermissionsProvider>
            <FormProvider>
                <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-blue-100 selection:text-blue-900 flex flex-col">
                    {/* Soft Ambient Glows */}
                    <div className="fixed top-[-5%] left-[-5%] w-[40%] h-[40%] bg-blue-400/5 rounded-full blur-[100px] pointer-events-none"></div>
                    <div className="fixed bottom-[-5%] right-[-5%] w-[35%] h-[35%] bg-indigo-400/5 rounded-full blur-[100px] pointer-events-none"></div>

                    {/* Sidebar - Desktop */}
                    <div className={`fixed inset-y-0 left-0 z-50 hidden lg:flex lg:flex-col min-h-0 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}`}>
                        <Suspense fallback={null}>
                            <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
                        </Suspense>
                    </div>

                    {/* Mobile Sidebar Overlay */}
                    {isMobileOpen && (
                        <div
                            className="fixed inset-0 z-50 lg:hidden"
                            onClick={() => setIsMobileOpen(false)}
                        >
                            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
                            <div
                                className="absolute inset-y-0 left-0 w-72 max-w-[85vw] flex flex-col"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Suspense fallback={null}>
                                    <Sidebar isCollapsed={false} onToggle={() => setIsMobileOpen(false)} />
                                </Suspense>
                            </div>
                        </div>
                    )}

                    {/* Main Content Area */}
                    <div className={`relative flex h-screen flex-col overflow-hidden bg-mesh transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isCollapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
                        <Header isCollapsed={isCollapsed} onMobileMenuToggle={() => setIsMobileOpen(true)} />
                        <main className={`flex-1 overflow-x-hidden ${isSettingsPage ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'}`}>
                            <div className={`relative ${isSettingsPage ? 'h-full overflow-y-auto custom-scrollbar' : ''} ${isMediaPage ? '' : 'p-4 sm:p-6 lg:p-8'}`}>
                                {/* Subtle background glow */}
                                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/10 rounded-full blur-[120px] pointer-events-none" />
                                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100/10 rounded-full blur-[120px] pointer-events-none" />

                                <div className="relative z-10">
                                    {children}
                                </div>
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
        </ModulesProvider>
    );
}
