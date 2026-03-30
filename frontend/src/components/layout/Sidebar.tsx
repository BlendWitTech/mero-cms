'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    HomeIcon,
    DocumentTextIcon,
    PhotoIcon,
    UserGroupIcon,
    Cog6ToothIcon,
    ChevronLeftIcon,
    ChevronDownIcon,
    ChartBarIcon,
    Bars3Icon,
    SwatchIcon,
    RectangleStackIcon,
    CircleStackIcon,
    ClipboardDocumentListIcon,
    BoltIcon,
    UsersIcon,
    InboxArrowDownIcon,
    NewspaperIcon,
    ChatBubbleLeftRightIcon,
    PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import { useSettings } from '@/context/SettingsContext';
import { usePermissions } from '@/context/PermissionsContext';
import { useModules } from '@/context/ModulesContext';
import { getVisibleNavItems, checkPermission } from '@/lib/permissions';
import { useForm } from '@/context/FormContext';
import UnsavedChangesAlert from '@/components/ui/UnsavedChangesAlert';

const initialNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    {
        name: 'Site Pages',
        href: '/dashboard/site-pages',
        icon: DocumentTextIcon,
        id: 'site-pages',
        requiredPermission: ['content_view', 'content_edit'],
    },
    {
        name: 'Content',
        icon: DocumentTextIcon,
        requiredPermission: ['content_view', 'content_create', 'content_edit'],
        children: [
            { name: 'Collections', href: '/dashboard/collections', icon: CircleStackIcon, requiredPermission: ['content_view', 'content_create'] },
            { name: 'Forms', href: '/dashboard/forms', icon: ClipboardDocumentListIcon, requiredPermission: ['content_view', 'content_create'], requiresModule: 'forms' },
            { name: 'Menus', href: '/dashboard/menus', icon: Bars3Icon, requiredPermission: 'content_edit', requiresModule: 'menus' },
            { name: 'Services', href: '/dashboard/services', requiredPermission: ['content_view', 'content_create'], requiresModule: 'services' },
            { name: 'Categories', href: '/dashboard/categories', requiredPermission: ['content_view', 'content_create'], requiresModule: 'categories' },
        ]
    },
    {
        name: 'Blog',
        icon: NewspaperIcon,
        requiredPermission: ['content_view', 'content_create'],
        requiresModule: 'blogs',
        children: [
            { name: 'All Posts', href: '/dashboard/blog', icon: DocumentTextIcon, requiredPermission: ['content_view', 'content_create'] },
            { name: 'New Post', href: '/dashboard/blog?action=new', icon: PencilSquareIcon, requiredPermission: 'content_create' },
            { name: 'Comments', href: '/dashboard/comments', icon: ChatBubbleLeftRightIcon, requiredPermission: ['content_view', 'content_edit'], requiresModule: 'comments' },
        ]
    },
    { name: 'Media', href: '/dashboard/media', icon: PhotoIcon, requiredPermission: 'media_view' },
    {
        name: 'User',
        icon: UserGroupIcon,
        requiredPermission: ['users_view', 'roles_view'],
        children: [
            { name: 'All Users', href: '/dashboard/users', requiredPermission: 'users_view' },
            { name: 'Roles & Permissions', href: '/dashboard/roles', requiredPermission: 'roles_view' },
        ]
    },
    {
        name: 'SEO & Analytics',
        icon: ChartBarIcon,
        requiredPermission: ['analytics_view', 'seo_manage'],
        children: [
            { name: 'Analytics', href: '/dashboard/analytics', requiredPermission: 'analytics_view', requiresModule: 'analytics' },
            { name: 'SEO Manager', href: '/dashboard/seo', requiredPermission: 'seo_manage', requiresModule: 'seo' },
        ]
    },
    { name: 'Leads', href: '/dashboard/leads', icon: ChartBarIcon, requiredPermission: 'leads_view', requiresModule: 'leads' },
    { name: 'Theme', href: '/dashboard/themes', icon: SwatchIcon, requiredPermission: 'settings_edit', requiresModule: 'themes' },
    { name: 'Webhooks', href: '/dashboard/webhooks', icon: BoltIcon, requiredPermission: 'settings_edit' },
    { name: 'Audit Log', href: '/dashboard/audit-log', icon: ClipboardDocumentListIcon, requiredPermission: 'audit_view' },
    { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon, requiredPermission: 'settings_edit', id: 'settings' },
];

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

const SidebarItem = ({ item, isCollapsed, isActive, pathname, level = 0, onNavigate }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = item.children && item.children.length > 0;

    useEffect(() => {
        if (hasChildren && item.children.some((child: any) =>
            child.href === pathname ||
            (child.children && child.children.some((c: any) => c.href === pathname))
        )) {
            setIsOpen(true);
        }
    }, [pathname, hasChildren, item.children]);

    const toggleOpen = () => setIsOpen(!isOpen);

    const handleClick = (e: React.MouseEvent, href: string) => {
        if (!href || href === '#') return;
        e.preventDefault();
        onNavigate(href);
    };

    if (level > 0) {
        if (hasChildren) {
            return (
                <li className="select-none">
                    <button
                        onClick={toggleOpen}
                        className={classNames(
                            isOpen ? "text-slate-900" : "text-slate-500",
                            "flex w-full items-center justify-between py-1.5 pr-2 text-xs font-bold hover:text-blue-600 transition-colors ml-3"
                        )}
                    >
                        <span>{item.name}</span>
                        <ChevronDownIcon className={classNames("h-3 w-3 transition-transform", isOpen ? "rotate-180" : "")} />
                    </button>
                    {isOpen && (
                        <ul className="mt-1 ml-3 border-l-2 border-slate-100 pl-3 space-y-1">
                            {item.children.map((child: any) => (
                                <SidebarItem
                                    key={child.name}
                                    item={child}
                                    isCollapsed={isCollapsed}
                                    isActive={child.href === pathname}
                                    pathname={pathname}
                                    level={level + 1}
                                    onNavigate={onNavigate}
                                />
                            ))}
                        </ul>
                    )}
                </li>
            );
        }
        return (
            <li>
                <a
                    href={item.href || '#'}
                    onClick={(e) => handleClick(e, item.href)}
                    className={classNames(
                        pathname === item.href ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-500 hover:text-slate-900',
                        'block rounded-lg px-2 py-1.5 text-xs font-semibold transition-all ml-1 cursor-pointer'
                    )}
                >
                    {item.name}
                </a>
            </li>
        );
    }

    return (
        <li className="relative group/item px-2">
            {hasChildren ? (
                <>
                    <button
                        onClick={toggleOpen}
                        className={classNames(
                            isActive || isOpen
                                ? 'text-blue-600 bg-blue-50/50'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80',
                            'group flex w-full items-center gap-x-3 rounded-xl p-2.5 text-sm font-bold transition-all duration-300 ease-out relative overflow-hidden',
                            isCollapsed ? 'justify-center' : ''
                        )}
                    >
                        {isActive && !isCollapsed && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
                        )}
                        {item.icon && (
                            <item.icon
                                className={classNames(
                                    isActive || isOpen ? 'text-blue-600 drop-shadow-[0_0_8px_rgba(37,99,235,0.2)]' : 'text-slate-500 group-hover:text-blue-600',
                                    'h-5 w-5 shrink-0 transition-all duration-300'
                                )}
                                aria-hidden="true"
                            />
                        )}
                        {!isCollapsed && (
                            <>
                                <span className="animate-in fade-in duration-500 font-bold flex-1 text-left">{item.name}</span>
                                <ChevronDownIcon className={classNames(
                                    "ml-auto h-3 w-3 transition-transform duration-300 text-slate-400 opacity-70",
                                    isOpen ? "rotate-180 text-blue-600 opacity-100" : ""
                                )} />
                            </>
                        )}
                    </button>
                    {!isCollapsed && isOpen && (
                        <ul className="mt-1 ml-4 space-y-1 border-l border-slate-100 pl-4 animate-in slide-in-from-top-1 fade-in duration-300">
                            {item.children.map((child: any) => (
                                <SidebarItem
                                    key={child.name}
                                    item={child}
                                    isCollapsed={false}
                                    isActive={child.href === pathname}
                                    pathname={pathname}
                                    level={level + 1}
                                    onNavigate={onNavigate}
                                />
                            ))}
                        </ul>
                    )}
                </>
            ) : (
                <a
                    href={item.href || '#'}
                    onClick={(e) => handleClick(e, item.href)}
                    className={classNames(
                        isActive
                            ? 'text-blue-600 bg-blue-50/50'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80',
                        'group flex items-center gap-x-3 rounded-xl p-2.5 text-sm font-bold transition-all duration-300 ease-out relative overflow-hidden cursor-pointer',
                        isCollapsed ? 'justify-center' : ''
                    )}
                >
                    {isActive && !isCollapsed && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
                    )}
                    {item.icon && (
                        <item.icon
                            className={classNames(
                                isActive ? 'text-blue-600 drop-shadow-[0_0_8px_rgba(37,99,235,0.2)]' : 'text-slate-500 group-hover:text-blue-600',
                                'h-5 w-5 shrink-0 transition-all duration-300 group-hover:scale-110'
                            )}
                            aria-hidden="true"
                        />
                    )}
                    {!isCollapsed && (
                        <span className="animate-in fade-in duration-500 font-bold">{item.name}</span>
                    )}
                </a>
            )}
        </li>
    );
};

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { permissions, isLoading: permissionsLoading } = usePermissions();
    const { enabledModules, isLoading: modulesLoading } = useModules();
    const [navItems, setNavItems] = useState(initialNavigation);
    const [moduleAliases, setModuleAliases] = useState<Record<string, string>>({});
    const { isDirty, setIsDirty, saveHandler } = useForm();
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
    const [showDiscardAlert, setShowDiscardAlert] = useState(false);
    const { settings } = useSettings();
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Consolidated Navigation Filtering and Theme Status Check
    useEffect(() => {
        const updateNavigation = async () => {
            if (permissionsLoading || modulesLoading || !permissions) return;

            setIsLoadingData(true);
            try {
                // 1. Initial Permission/Module Filtering
                let updatedItems = getVisibleNavItems(initialNavigation, permissions, enabledModules);

                // 2. Theme-Specific Enhancements (if permitted)
                if (checkPermission(permissions, 'content_view')) {
                    // Fetch Aliases and Config in parallel
                    const [aliasRes, themeConfig] = await Promise.all([
                        apiRequest('/themes/active/module-aliases', { skipNotification: true }).catch(() => ({})),
                        apiRequest('/themes/active/config', { skipNotification: true }).catch(() => ({})),
                    ]);

                    const aliases: Record<string, string> = aliasRes?.moduleAliases || {};
                    setModuleAliases(aliases);

                    const themeModules = themeConfig?.modules || themeConfig?.requiredModules || [];

                    updatedItems = updatedItems.map((item: any) => {
                        // A. Dynamic Content Submenu
                        if (item.name === 'Content' && item.children) {
                            const currentChildren = [...item.children];
                            const dynamicModules = [
                                { key: 'team', name: 'Team', href: '/dashboard/team', icon: UserGroupIcon },
                                { key: 'testimonials', name: 'Testimonials', href: '/dashboard/testimonials', icon: RectangleStackIcon },
                            ];

                            dynamicModules.forEach(mod => {
                                const isSupported = themeModules.includes(mod.key);
                                const alreadyExists = currentChildren.some(c => c.requiresModule === mod.key);
                                
                                if (isSupported && !alreadyExists) {
                                    currentChildren.push({ 
                                        name: aliases[mod.key] || mod.name, 
                                        href: mod.href, 
                                        requiredPermission: ['content_view', 'content_create'],
                                        requiresModule: mod.key 
                                    });
                                }
                            });

                            return {
                                ...item,
                                children: currentChildren.map((child: any) => {
                                    const alias = aliases[child.requiresModule];
                                    return alias ? { ...child, name: alias } : child;
                                })
                            };
                        }

                        // B. Leads Visibility
                        if (item.name === 'Leads') {
                            const isSupported = themeModules.includes('leads');
                            return isSupported ? item : null;
                        }

                        // C. Site Pages — Section Editor + All Pages only (no per-page shortcuts)
                        if (item.name === 'Site Pages') {
                            return {
                                ...item,
                                href: undefined,
                                children: [
                                    { name: 'Section Editor', href: '/dashboard/site-pages' },
                                    { name: 'All Pages', href: '/dashboard/pages' },
                                ],
                            };
                        }

                        return item;
                    }).filter(Boolean) as any;
                }

                setNavItems(updatedItems);
            } catch (error) {
                console.error('Failed to update navigation:', error);
            } finally {
                setIsLoadingData(false);
            }
        };

        updateNavigation();
    }, [permissions, permissionsLoading, enabledModules, modulesLoading, settings['active_theme']]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '[' || e.key === ']') onToggle();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onToggle]);

    const handleNavigation = (href: string) => {
        const currentSearch = typeof window !== 'undefined' ? window.location.search : '';
        const currentUrl = pathname + currentSearch;
        if (href === currentUrl || href === '#') return;
        if (isDirty) {
            setPendingNavigation(href);
            setShowDiscardAlert(true);
        } else {
            router.push(href);
        }
    };

    const confirmNavigation = () => {
        setIsDirty(false);
        setShowDiscardAlert(false);
        if (pendingNavigation) {
            router.push(pendingNavigation);
            setPendingNavigation(null);
        }
    };

    const cancelNavigation = () => {
        setShowDiscardAlert(false);
        setPendingNavigation(null);
    };

    const handleSaveAndExit = async () => {
        if (saveHandler) {
            try {
                await saveHandler();
                confirmNavigation();
            } catch (error) {
                setShowDiscardAlert(false);
            }
        }
    };

    return (
        <div className="relative flex grow flex-col min-h-0 border-r border-slate-200/40 bg-white/70 backdrop-blur-3xl transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[1px_0_10px_rgba(0,0,0,0.02)] isolate">
            <UnsavedChangesAlert
                isOpen={showDiscardAlert}
                onSaveAndExit={saveHandler ? handleSaveAndExit : undefined}
                onDiscardAndExit={confirmNavigation}
                onCancel={cancelNavigation}
                title="Unsaved Changes"
                description="You have unsaved changes. What would you like to do?"
                confirmLabel={saveHandler ? "Save & Exit" : undefined}
                secondaryLabel="Discard & Leave"
                cancelLabel="Keep Editing"
                variant={saveHandler ? "success" : "danger"}
            />

            <div className="fixed lg:absolute -right-3 top-8 z-[100] group/toggle">
                <button
                    onClick={onToggle}
                    className="relative flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-lg shadow-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:scale-110 active:scale-95 transition-all duration-500"
                >
                    <ChevronLeftIcon className={classNames("h-3.5 w-3.5 transition-transform duration-700", isCollapsed ? "rotate-180" : "")} />
                </button>
            </div>

            <div className="flex flex-col grow overflow-y-auto px-1.5 pb-4 custom-scrollbar overflow-x-visible">
                <div className="flex h-16 shrink-0 items-center px-3.5 pt-4">
                    {!isCollapsed ? (
                        <div className="flex flex-col">
                            <span className="text-lg font-black tracking-tight text-slate-900 animate-in fade-in zoom-in duration-500 font-display leading-none">
                                {settings['site_title']?.toUpperCase() || 'BLENDWIT'}
                                <span className="text-blue-600 ml-0.5 font-bold">CMS</span>
                            </span>
                        </div>
                    ) : (
                        <div className="mx-auto w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg flex items-center justify-center text-white font-bold text-sm">
                            {settings['site_title'] ? settings['site_title'].charAt(0).toUpperCase() : 'B'}
                        </div>
                    )}
                </div>

                <nav className="flex flex-1 flex-col mt-4">
                    <ul role="list" className="flex flex-1 flex-col gap-y-6">
                        <li>
                            <div className={`text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-3.5 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                                {!isCollapsed ? 'Management' : '•••'}
                            </div>
                            <ul role="list" className="flex flex-1 flex-col gap-y-1 px-3">
                                {isLoadingData ? (
                                    <div className="flex flex-col gap-y-4 px-2 py-4">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div key={i} className="h-8 w-full bg-slate-50 animate-pulse rounded-lg flex items-center gap-x-3 px-2">
                                                <div className="h-5 w-5 bg-slate-200 rounded shrink-0" />
                                                {!isCollapsed && <div className="h-3 w-2/3 bg-slate-100 rounded" />}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    navItems.map((item) => (
                                        <SidebarItem
                                            key={item.name}
                                            item={item}
                                            isCollapsed={isCollapsed}
                                            isActive={
                                                item.href === pathname ||
                                                (item.children && item.children.some((child: any) =>
                                                    child.href === pathname ||
                                                    (child.children && child.children.some((c: any) => c.href === pathname))
                                                ))
                                            }
                                            pathname={pathname}
                                            onNavigate={handleNavigation}
                                        />
                                    ))
                                )}
                            </ul>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    );
}
