'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { PermissionsProvider } from '@/context/PermissionsContext';
import { FormProvider } from '@/context/FormContext';
import { ModulesProvider } from '@/context/ModulesContext';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [revocationMessage, setRevocationMessage] = useState<string | null>(null);
    const pathname = usePathname();
    const router = useRouter();
    const isMediaPage = pathname?.includes('/media');

    useEffect(() => {
        const handleSessionRevoked = (event: any) => {
            setRevocationMessage(event.detail.message);
        };

        window.addEventListener('session-revoked', handleSessionRevoked);
        return () => window.removeEventListener('session-revoked', handleSessionRevoked);
    }, []);

    const finalizeLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    };

    return (
        <ModulesProvider>
        <PermissionsProvider>
            <FormProvider>
                <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-blue-100 selection:text-blue-900">
                    {/* Soft Ambient Glows */}
                    <div className="fixed top-[-5%] left-[-5%] w-[40%] h-[40%] bg-blue-400/5 rounded-full blur-[100px] pointer-events-none"></div>
                    <div className="fixed bottom-[-5%] right-[-5%] w-[35%] h-[35%] bg-indigo-400/5 rounded-full blur-[100px] pointer-events-none"></div>

                    {/* Sidebar - Desktop */}
                    <div className={`fixed inset-y-0 left-0 z-50 hidden lg:flex lg:flex-col transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}`}>
                        <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
                    </div>

                    {/* Main Content Area */}
                    <div className={`relative flex min-h-screen flex-1 flex-col overflow-x-hidden bg-mesh custom-scrollbar transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isCollapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
                        <Header isCollapsed={isCollapsed} />
                        <main className="flex-1 flex flex-col">
                            <div className={`relative flex-1 ${isMediaPage ? 'p-0' : 'p-8'}`}>
                                {/* Subtle background glow */}
                                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/10 rounded-full blur-[120px] pointer-events-none" />
                                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100/10 rounded-full blur-[120px] pointer-events-none" />

                                <div className="relative z-10 flex-1 h-full">
                                    {children}
                                </div>
                            </div>
                        </main>
                    </div>

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
