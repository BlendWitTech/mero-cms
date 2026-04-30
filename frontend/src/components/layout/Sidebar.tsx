'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
    LayoutDashboard,
    FileText,
    Image as ImageIcon,
    Users,
    Settings,
    ChevronLeft,
    ChevronDown,
    BarChart3,
    Menu as MenuIcon,
    Layers,
    Database,
    ClipboardList,
    Zap,
    Newspaper,
    MessageSquare,
    ExternalLink,
    Bot,
    Fingerprint,
    UserRound,
    Star,
    Briefcase,
    Inbox,
    Globe,
    Building2,
    BadgeCheck,
    Rocket,
    ShieldCheck,
    Mail,
    Cloud,
    Puzzle,
    Palette,
    ArrowLeft,
    AlertTriangle,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useSettings } from '@/context/SettingsContext';
import { usePermissions } from '@/context/PermissionsContext';
import { useModules } from '@/context/ModulesContext';
import { useCapabilities } from '@/context/CapabilitiesContext';
import { getVisibleNavItems, checkPermission } from '@/lib/permissions';
import { useForm } from '@/context/FormContext';
import UnsavedChangesAlert from '@/components/ui/UnsavedChangesAlert';

const initialNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    {
        name: 'Site Pages',
        href: '/dashboard/site-pages',
        icon: FileText,
        id: 'site-pages',
        requiredPermission: ['content_view', 'content_edit'],
        requiresCapability: 'siteEditor',
    },
    {
        name: 'Content',
        icon: Layers,
        requiredPermission: ['content_view', 'content_create', 'content_edit'],
        children: [
            { name: 'Collections', href: '/dashboard/collections', icon: Database, requiredPermission: ['content_view', 'content_create'], requiresCapability: 'collections' },
            { name: 'Forms', href: '/dashboard/forms', icon: ClipboardList, requiredPermission: ['content_view', 'content_create'], requiresModule: 'forms', requiresCapability: 'forms' },
            { name: 'Menus', href: '/dashboard/menus', icon: MenuIcon, requiredPermission: 'content_edit', requiresModule: 'menus' },
            { name: 'Categories', href: '/dashboard/categories', requiredPermission: ['content_view', 'content_create'], requiresModule: 'categories' },
            { name: 'Team', href: '/dashboard/team', icon: UserRound, requiredPermission: 'content_edit', requiresModule: 'team' },
            { name: 'Testimonials', href: '/dashboard/testimonials', icon: Star, requiredPermission: 'content_edit', requiresModule: 'testimonials' },
            { name: 'Services', href: '/dashboard/services', icon: Briefcase, requiredPermission: 'content_edit', requiresModule: 'services' },
            { name: 'Leads', href: '/dashboard/leads', icon: Inbox, requiredPermission: 'content_view', requiresModule: 'leads' },
        ]
    },
    {
        name: 'Blog',
        icon: Newspaper,
        requiredPermission: ['content_view', 'content_create'],
        requiresModule: 'blogs',
        children: [
            { name: 'All Posts', href: '/dashboard/blog', requiredPermission: ['content_view', 'content_create'] },
            { name: 'New Post', href: '/dashboard/blog?action=new', requiredPermission: 'content_create' },
            { name: 'Comments', href: '/dashboard/comments', icon: MessageSquare, requiredPermission: ['content_view', 'content_edit'], requiresModule: 'comments' },
        ]
    },
    { name: 'Media', href: '/dashboard/media', icon: ImageIcon, requiredPermission: 'media_view' },
    { name: 'Plugins', href: '/dashboard/plugins', icon: Puzzle, requiredPermission: 'settings_edit', requiresCapability: 'pluginMarketplace' },
    {
        name: 'Users',
        icon: Users,
        requiredPermission: ['users_view', 'roles_view'],
        children: [
            { name: 'All Users', href: '/dashboard/users', requiredPermission: 'users_view' },
            { name: 'Roles & Permissions', href: '/dashboard/roles', icon: Fingerprint, requiredPermission: 'roles_view' },
        ]
    },
    {
        name: 'SEO & Analytics',
        icon: BarChart3,
        requiredPermission: ['analytics_view', 'seo_manage'],
        children: [
            { name: 'Analytics', href: '/dashboard/analytics', requiredPermission: 'analytics_view', requiresModule: 'analytics', requiresCapability: 'analytics' },
            { name: 'SEO Manager', href: '/dashboard/seo', requiredPermission: 'seo_manage', requiresModule: 'seo' },
        ]
    },
    {
        name: 'Theme',
        icon: Zap,
        requiredPermission: 'settings_edit',
        requiresModule: 'themes',
        children: [
            { name: 'Themes', href: '/dashboard/themes', requiredPermission: 'settings_edit' },
            { name: 'Visual Editor', href: '/dashboard/themes/visual-editor', requiredPermission: 'settings_edit', requiresCapability: 'visualThemeEditor' },
            { name: 'Code Editor', href: '/dashboard/themes/code', requiredPermission: 'settings_edit', requiresCapability: 'themeCodeEdit' },
        ],
    },
    { name: 'Webhooks', href: '/dashboard/webhooks', icon: Bot, requiredPermission: 'settings_edit', requiresCapability: 'webhooks' },
    { name: 'API Keys', href: '/dashboard/api-keys', icon: Fingerprint, requiredPermission: 'settings_edit', requiresCapability: 'hasApiAccess' },
    { name: 'AI Studio', href: '/dashboard/ai-studio', icon: Zap, requiredPermission: 'settings_edit', requiresCapability: 'aiEnabled' },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, requiredPermission: 'settings_edit', id: 'settings' },
];

function cn(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

function checkIsActive(href: string | undefined, pathname: string, searchParams: any) {
    if (!href) return false;
    const [base, query] = href.split('?');
    if (base !== pathname) return false;

    if (query) {
        const queryParams = new URLSearchParams(query);
        for (const [key, value] of queryParams.entries()) {
            if (searchParams?.get(key) !== value) return false;
        }
        return true;
    }

    if (searchParams && searchParams.get('action')) {
        return false;
    }

    return true;
}

/* ─── Collapsed flyout portal ─────────────────────────── */
function CollapsedFlyout({
    item,
    top,
    pathname,
    onNavigate,
    onMouseEnter,
    onMouseLeave,
}: {
    item: any;
    top: number;
    pathname: string;
    onNavigate: (href: string) => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}) {
    const searchParams = useSearchParams();
    if (typeof window === 'undefined') return null;
    return createPortal(
        <div
            className="fixed z-[9999] left-[82px] w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 shadow-2xl overflow-hidden py-1 animate-in fade-in slide-in-from-left-2 duration-150"
            style={{ top }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {/* Group label */}
            <div className="px-4 py-2.5 border-b border-slate-50 dark:border-white/[0.06]">
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">{item.name}</p>
            </div>
            {item.children.map((child: any) => {
                const isChildActive = checkIsActive(child.href, pathname, searchParams);
                return (
                    <a
                        key={child.name}
                        href={child.href || '#'}
                        onClick={(e) => {
                            e.preventDefault();
                            onNavigate(child.href);
                            onMouseLeave();
                        }}
                        className={cn(
                            'flex items-center gap-3 px-4 py-2.5 text-[12px] font-semibold transition-colors',
                            isChildActive
                                ? 'bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-white font-semibold'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white'
                        )}
                    >
                        {isChildActive && <span className="h-1.5 w-1.5 rounded-full bg-slate-800 dark:bg-white shrink-0" />}
                        {child.name}
                    </a>
                );
            })}
        </div>,
        document.body
    );
}

/* ─── SidebarItem ─────────────────────────────────────── */
const SidebarItem = ({ item, isCollapsed, isActive, pathname, level = 0, onNavigate, controlledOpen, onGroupToggle }: any) => {
    const searchParams = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);
    const [flyoutTop, setFlyoutTop] = useState<number | null>(null);
    const [flyoutPinned, setFlyoutPinned] = useState(false);
    const itemRef = useRef<HTMLLIElement>(null);
    const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasChildren = item.children && item.children.length > 0;

    // Only auto-open for level > 0 (level 0 open state is controlled by parent for accordion)
    useEffect(() => {
        if (level > 0 && hasChildren && item.children.some((child: any) =>
            checkIsActive(child.href, pathname, searchParams) ||
            (child.children && child.children.some((c: any) => checkIsActive(c.href, pathname, searchParams)))
        )) {
            setIsOpen(true);
        }
    }, [pathname, searchParams, hasChildren, item.children, level]);

    const toggleOpen = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (level === 0 && onGroupToggle) {
            onGroupToggle(item.name);
        } else {
            setIsOpen(!isOpen);
        }
    };

    const handleClick = (e: React.MouseEvent, href: string) => {
        if (!href || href === '#') return;
        e.preventDefault();
        onNavigate(href);
    };

    /* flyout hover logic for collapsed mode */
    const handleItemMouseEnter = useCallback(() => {
        if (!isCollapsed || !hasChildren) return;
        if (leaveTimer.current) clearTimeout(leaveTimer.current);
        if (itemRef.current) {
            const rect = itemRef.current.getBoundingClientRect();
            setFlyoutTop(rect.top);
        }
    }, [isCollapsed, hasChildren]);

    const handleItemMouseLeave = useCallback(() => {
        if (!isCollapsed || !hasChildren) return;
        leaveTimer.current = setTimeout(() => {
            if (!flyoutPinned) setFlyoutTop(null);
        }, 80);
    }, [isCollapsed, hasChildren, flyoutPinned]);

    const handleFlyoutMouseEnter = useCallback(() => {
        if (leaveTimer.current) clearTimeout(leaveTimer.current);
        setFlyoutPinned(true);
    }, []);

    const handleFlyoutMouseLeave = useCallback(() => {
        setFlyoutPinned(false);
        setFlyoutTop(null);
    }, []);

    /* ── Level > 0 child items ──────────────────────────── */
    if (level > 0) {
        if (hasChildren) {
            return (
                <li className="select-none list-none">
                    <button
                        onClick={toggleOpen}
                        className={cn(
                            isOpen ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300',
                            'flex w-full items-center justify-between py-1.5 pr-2 text-[10px] font-semibold uppercase tracking-[0.18em] hover:text-slate-900 dark:hover:text-white transition-colors ml-3'
                        )}
                    >
                        <span>{item.name}</span>
                        <ChevronDown size={10} className={cn('transition-transform duration-200', isOpen ? 'rotate-180' : '')} />
                    </button>
                    {isOpen && (
                        <ul className="mt-0.5 ml-3 border-l-2 border-slate-100 dark:border-white/[0.08] pl-3 space-y-0.5">
                            {item.children.map((child: any) => (
                                <SidebarItem
                                    key={child.name}
                                    item={child}
                                    isCollapsed={isCollapsed}
                                    isActive={checkIsActive(child.href, pathname, searchParams)}
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

        const isChildActive = checkIsActive(item.href, pathname, searchParams);
        return (
            <li className="list-none">
                <a
                    href={item.href || '#'}
                    onClick={(e) => handleClick(e, item.href)}
                    className={cn(
                        isChildActive
                            ? 'text-slate-900 dark:text-white font-semibold bg-slate-100 dark:bg-white/[0.08]'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04]',
                        'flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium transition-all cursor-pointer'
                    )}
                >
                    {isChildActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-700 dark:bg-white shrink-0" />
                    )}
                    <span className={isChildActive ? '' : 'ml-[10px]'}>{item.name}</span>
                </a>
            </li>
        );
    }

    /* ── Level 0 top-level items ────────────────────────── */
    const level0IsOpen = controlledOpen ?? false;
    const activeClass = 'text-slate-900 dark:text-white bg-slate-100 dark:bg-white/[0.07]';
    const inactiveClass = 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04]';

    return (
        <li
            ref={itemRef}
            className="relative group/item px-3 list-none"
            onMouseEnter={handleItemMouseEnter}
            onMouseLeave={handleItemMouseLeave}
        >
            {hasChildren ? (
                <>
                    <button
                        onClick={toggleOpen}
                        className={cn(
                            isActive || level0IsOpen ? activeClass : inactiveClass,
                            'group flex w-full items-center gap-x-2.5 rounded-xl p-2.5 text-sm font-semibold transition-all duration-200 relative',
                            isCollapsed ? 'justify-center' : ''
                        )}
                    >
                        {item.icon && (
                            <span className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200',
                                isActive || level0IsOpen ? 'bg-slate-200 dark:bg-white/[0.12]' : 'bg-slate-100 dark:bg-white/[0.05] group-hover:bg-slate-200 dark:group-hover:bg-white/[0.1]'
                            )}>
                                <item.icon
                                    size={16}
                                    strokeWidth={2}
                                    className={cn(
                                        isActive || level0IsOpen ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200',
                                        'transition-colors duration-200'
                                    )}
                                />
                            </span>
                        )}
                        {!isCollapsed && (
                            <>
                                <span className="flex-1 text-left text-[13px] font-semibold">{item.name}</span>
                                <ChevronDown
                                    size={12}
                                    strokeWidth={2.5}
                                    className={cn(
                                        'transition-transform duration-200',
                                        isActive || level0IsOpen ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-600',
                                        level0IsOpen ? 'rotate-180' : ''
                                    )}
                                />
                            </>
                        )}
                    </button>

                    {/* Expanded children */}
                    {!isCollapsed && level0IsOpen && (
                        <ul className="mt-1 mx-1 space-y-0.5 border-l-2 border-slate-100 dark:border-white/[0.07] pl-4 ml-5">
                            {item.children.map((child: any) => (
                                <SidebarItem
                                    key={child.name}
                                    item={child}
                                    isCollapsed={false}
                                    isActive={checkIsActive(child.href, pathname, searchParams)}
                                    pathname={pathname}
                                    level={level + 1}
                                    onNavigate={onNavigate}
                                />
                            ))}
                        </ul>
                    )}

                    {/* Collapsed flyout */}
                    {isCollapsed && flyoutTop !== null && (
                        <CollapsedFlyout
                            item={item}
                            top={flyoutTop}
                            pathname={pathname}
                            onNavigate={onNavigate}
                            onMouseEnter={handleFlyoutMouseEnter}
                            onMouseLeave={handleFlyoutMouseLeave}
                        />
                    )}
                </>
            ) : (
                <a
                    href={item.href || '#'}
                    onClick={(e) => handleClick(e, item.href)}
                    className={cn(
                        isActive ? activeClass : inactiveClass,
                        'group flex items-center gap-x-2.5 rounded-xl p-2.5 text-[13px] font-semibold transition-all duration-200 relative cursor-pointer',
                        isCollapsed ? 'justify-center' : ''
                    )}
                >
                    {item.icon && (
                        <span className={cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200',
                            isActive ? 'bg-slate-200 dark:bg-white/[0.12]' : 'bg-slate-100 dark:bg-white/[0.05] group-hover:bg-slate-200 dark:group-hover:bg-white/[0.1]'
                        )}>
                            <item.icon
                                size={16}
                                strokeWidth={2}
                                className={cn(
                                    isActive ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200',
                                    'transition-colors duration-200'
                                )}
                            />
                        </span>
                    )}
                    {!isCollapsed && (
                        <span className="flex-1 text-[13px] font-semibold">{item.name}</span>
                    )}
                </a>
            )}
        </li>
    );
};

/* ─── Main Sidebar ────────────────────────────────────── */
interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { permissions, license, isLoading: permissionsLoading } = usePermissions();
    const { enabledModules, isLoading: modulesLoading } = useModules();
    const { capabilities, limits, isLoading: capsLoading } = useCapabilities();
    const [navItems, setNavItems] = useState(initialNavigation);
    const [openGroupName, setOpenGroupName] = useState<string | null>(null);
    const { isDirty, setIsDirty, saveHandler } = useForm();
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
    const [showDiscardAlert, setShowDiscardAlert] = useState(false);
    const { settings } = useSettings();
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [subMenu, setSubMenu] = useState<'settings' | null>(null);

    // Settings Navigation Groups. Items may declare `requiresCapability`;
    // the render loop below filters them against the active plan.
    const settingsNavigationRaw = [
        {
            title: 'Website',
            items: [
                { id: 'branding', name: 'Branding', icon: Globe, href: '/dashboard/settings?tab=branding' },
                { id: 'website', name: 'Content', icon: Building2, href: '/dashboard/settings?tab=website' },
            ]
        },
        {
            title: 'Appearance',
            items: [
                {
                    id: 'admin-appearance',
                    name: 'Dashboard Branding',
                    icon: Palette as any,
                    href: '/dashboard/settings?tab=admin-appearance',
                    requiresCapability: 'dashboardBranding',
                },
            ]
        },
        {
            title: 'Security',
            items: [
                { id: 'audit-logs', name: 'Audit Log', icon: Fingerprint, href: '/dashboard/settings?tab=audit-logs', requiresCapability: 'auditLog' },
                { id: 'license', name: 'License', icon: BadgeCheck, href: '/dashboard/settings?tab=license' },
                { id: 'security', name: 'Security', icon: ShieldCheck, href: '/dashboard/settings?tab=security' },
            ]
        },
        {
            title: 'Other',
            items: [
                { id: 'email', name: 'Email', icon: Mail, href: '/dashboard/settings?tab=email' },
                { id: 'media', name: 'Cloud', icon: Cloud, href: '/dashboard/settings?tab=media' },
                { id: 'modules', name: 'Modules', icon: Puzzle, href: '/dashboard/settings?tab=modules' },
                { id: 'billing', name: 'Package & Billings', icon: Database, href: '/dashboard/settings?tab=billing' },
                // Danger Zone — destructive actions (reset content, factory
                // reset, theme reinstall). Lives at the bottom of the
                // sidebar so it's intentionally hard to reach by accident.
                { id: 'danger-zone', name: 'Danger Zone', icon: AlertTriangle, href: '/dashboard/settings?tab=danger-zone' },
            ]
        }
    ];

    // Filter settings submenu items against plan capabilities, drop empty groups.
    const settingsNavigation = settingsNavigationRaw
        .map((group) => ({
            ...group,
            items: group.items.filter(
                (i: any) =>
                    !i.requiresCapability ||
                    (!capsLoading && capabilities && (capabilities as any)[i.requiresCapability])
            ),
        }))
        .filter((group) => group.items.length > 0);

    // Detect if we are in Settings
    useEffect(() => {
        if (pathname?.startsWith('/dashboard/settings')) {
            setSubMenu('settings');
        } else {
            setSubMenu(null);
        }
    }, [pathname]);

    useEffect(() => {
        const updateNavigation = async () => {
            if (permissionsLoading || modulesLoading || capsLoading || !permissions) return;
            setIsLoadingData(true);
            try {
                // Merge limits flags (hasApiAccess, aiEnabled, hasWhiteLabel)
                // into the capabilities record so nav items can declare
                // `requiresCapability: 'hasApiAccess'` and get gated the
                // same way as regular boolean capabilities.
                const mergedCaps: Record<string, boolean | number> = {
                    ...(capabilities || {}),
                    hasApiAccess: !!limits?.hasApiAccess,
                    aiEnabled: !!limits?.aiEnabled,
                    hasWhiteLabel: !!limits?.hasWhiteLabel,
                } as any;
                let updatedItems = getVisibleNavItems(
                    initialNavigation,
                    permissions,
                    enabledModules,
                    mergedCaps,
                );

                if (checkPermission(permissions, 'content_view')) {
                    const [aliasRes] = await Promise.all([
                        apiRequest('/themes/active/module-aliases', { skipNotification: true }).catch(() => ({})),
                        apiRequest('/themes/active/config', { skipNotification: true }).catch(() => ({})),
                    ]);

                    const aliases: Record<string, string> = aliasRes?.moduleAliases || {};

                    updatedItems = updatedItems.map((item: any) => {
                        if (item.name === 'Content' && item.children) {
                            return {
                                ...item,
                                children: item.children.map((child: any) => {
                                    const alias = aliases[child.requiresModule];
                                    return alias ? { ...child, name: alias } : child;
                                })
                            };
                        }
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
    }, [permissions, permissionsLoading, enabledModules, modulesLoading, capabilities, capsLoading, settings['active_theme']]);

    // Auto-open the group containing the current page; close all when on a non-group page
    useEffect(() => {
        let activeGroupFound = false;
        navItems.forEach((item: any) => {
            if (item.children && item.children.some((c: any) =>
                checkIsActive(c.href, pathname, searchParams) ||
                (c.children && c.children.some((cc: any) => checkIsActive(cc.href, pathname, searchParams)))
            )) {
                setOpenGroupName(item.name);
                activeGroupFound = true;
            }
        });
        if (!activeGroupFound) setOpenGroupName(null);
    }, [pathname, searchParams, navItems]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '[' || e.key === ']') onToggle();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onToggle]);

    const handleNavigation = (href: string) => {
        if (isDirty) {
            setPendingNavigation(href);
            setShowDiscardAlert(true);
        } else {
            window.dispatchEvent(new Event('navigation-start'));
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
            } catch {
                setShowDiscardAlert(false);
            }
        }
    };

    return (
        <div className="relative flex grow flex-col min-h-0 border-r border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#0d1117] transition-all duration-300 ease-in-out shadow-sm dark:shadow-xl dark:shadow-black/30">
            <UnsavedChangesAlert
                isOpen={showDiscardAlert}
                onSaveAndExit={saveHandler ? handleSaveAndExit : undefined}
                onDiscardAndExit={confirmNavigation}
                onCancel={cancelNavigation}
                title="Unsaved Changes"
                description="You have unsaved changes. What would you like to do?"
                confirmLabel={saveHandler ? 'Save & Exit' : undefined}
                secondaryLabel="Discard & Leave"
                cancelLabel="Keep Editing"
                variant={saveHandler ? 'success' : 'danger'}
            />

            {/* Collapse toggle */}
            <div className="absolute -right-3 top-10 z-[100]">
                <button
                    onClick={onToggle}
                    className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 shadow-sm text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                >
                    <ChevronLeft size={14} strokeWidth={3} className={cn('transition-transform duration-300', isCollapsed ? 'rotate-180' : '')} />
                </button>
            </div>

            <div className="flex flex-col grow overflow-y-auto pb-6 custom-scrollbar">
                {/* Brand mark.
                    Two states:
                      • Collapsed sidebar — just the Mero emblem (M-shape).
                      • Expanded sidebar — emblem + the customer's site
                        title (no "CMS" suffix; this is the customer's
                        admin for THEIR site, not for "Mero CMS"). The
                        SVG emblem carries the same red/navy as the
                        marketing site so the admin still reads as part
                        of the Mero product family. */}
                <div className={cn('flex shrink-0 items-center h-[64px]', isCollapsed ? 'justify-center px-2' : 'px-5')}>
                    {!isCollapsed ? (
                        <div className="flex items-center gap-2.5 brand-mark select-none">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/emblem.svg" alt="Mero" className="w-8 h-8 shrink-0 brand-mark brand-mark-emblem" />
                            <span className="text-sm font-black tracking-tighter text-slate-900 dark:text-white uppercase truncate">
                                {settings['site_title'] || 'MERO'}
                            </span>
                        </div>
                    ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src="/emblem.svg" alt="Mero" className="w-8 h-8 brand-mark brand-mark-emblem" />
                    )}
                </div>

                {/* Nav section label */}
                {!isCollapsed && (
                    <div className="flex items-center gap-2 px-5 mb-2">
                        <span className="h-px flex-1 bg-slate-100 dark:bg-white/[0.06]" />
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.25em]">Menu</span>
                        <span className="h-px flex-1 bg-slate-100 dark:bg-white/[0.06]" />
                    </div>
                )}

                {/* Nav items */}
                <nav className="flex-1 px-0">
                    <ul role="list" className="flex flex-col gap-y-0.5 py-1">
                        {isLoadingData ? (
                            <div className="space-y-1.5 px-3 py-2">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="h-9 w-full bg-slate-100 dark:bg-white/5 animate-pulse rounded-xl" />
                                ))}
                            </div>
                        ) : subMenu === 'settings' ? (
                            <div className="space-y-6">
                                {/* Back Button */}
                                <div className="px-3">
                                    <button
                                        onClick={() => handleNavigation('/dashboard')}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all group"
                                    >
                                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                                        <span>Back to Main</span>
                                    </button>
                                </div>

                                {settingsNavigation.map((group) => (
                                    <div key={group.title} className="space-y-1">
                                        {!isCollapsed && (
                                            <h3 className="px-7 text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.25em] mb-2">{group.title}</h3>
                                        )}
                                        {group.items.map((item) => {
                                            const isActive = checkIsActive(item.href, pathname, searchParams);
                                            return (
                                                <SidebarItem
                                                    key={item.name}
                                                    item={item}
                                                    isCollapsed={isCollapsed}
                                                    isActive={isActive}
                                                    pathname={pathname}
                                                    onNavigate={handleNavigation}
                                                />
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            navItems.map((item) => {
                                const isItemActive =
                                    checkIsActive(item.href, pathname, searchParams) ||
                                    !!(item.children && item.children.some((child: any) =>
                                        checkIsActive(child.href, pathname, searchParams) ||
                                        (child.children && child.children.some((c: any) => checkIsActive(c.href, pathname, searchParams)))
                                    ));
                                return (
                                    <SidebarItem
                                        key={item.name}
                                        item={item}
                                        isCollapsed={isCollapsed}
                                        isActive={isItemActive}
                                        pathname={pathname}
                                        onNavigate={handleNavigation}
                                        controlledOpen={item.children ? openGroupName === item.name : undefined}
                                        onGroupToggle={(name: string) => setOpenGroupName(prev => prev === name ? null : name)}
                                    />
                                );
                            })
                        )}
                    </ul>
                </nav>

                {/* License badge */}
                {license && (
                    <div className={cn('mt-auto', isCollapsed ? 'flex justify-center pb-4 px-2' : 'px-3 pt-4 pb-2')}>
                        {!isCollapsed ? (
                            <div className={cn(
                                'rounded-xl p-4 border transition-all duration-300',
                                license.tier >= 2
                                    ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-600/20'
                                    : 'bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/10'
                            )}>
                                <div className="flex items-center gap-2.5 mb-3">
                                    <div className={cn(
                                        'h-8 w-8 rounded-lg flex items-center justify-center',
                                        license.tier >= 2 ? 'bg-white/20 text-white' : 'bg-blue-600/10 text-blue-600 dark:text-blue-400'
                                    )}>
                                        <Fingerprint size={16} strokeWidth={2.5} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className={cn('text-[9px] font-black uppercase tracking-widest opacity-60', license.tier >= 2 ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400')}>License</p>
                                        <p className={cn('text-[11px] font-black truncate', license.tier >= 2 ? 'text-white' : 'text-slate-900 dark:text-white')}>
                                            {license.tierName?.toUpperCase()} EDITION
                                        </p>
                                    </div>
                                </div>
                                {license.isDemo ? (
                                    <div className="bg-amber-400/15 text-amber-600 dark:text-amber-400 text-[9px] font-black text-center py-1.5 rounded-lg border border-amber-400/20 uppercase tracking-widest">
                                        Demo Session
                                    </div>
                                ) : (
                                    <div className={cn('text-[9px] font-black text-center py-1.5 rounded-lg border uppercase tracking-widest',
                                        license.tier >= 2 ? 'bg-white/10 text-white border-white/20' : 'bg-blue-600/5 text-blue-600 border-blue-600/10')}>
                                        Verified System
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-300',
                                license.tier >= 2
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/20'
                                    : 'bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/10 text-blue-600 dark:text-blue-400'
                            )}>
                                <Fingerprint size={15} strokeWidth={2.5} />
                            </div>
                        )}
                    </div>
                )}

                {/* Footer branding.
                    Renders the full Mero CMS wordmark above the
                    "Engineered by Blendwit" line. The wordmark is
                    suppressed when whitelabel_hide_powered_by is on
                    (Pro/Enterprise tiers + Custom). The Blendwit byline
                    stays — it's the studio attribution, separate from
                    the powered-by branding.
                    `mt-auto` pins this block to the bottom of the
                    flex column. Without it, on tall screens with a
                    short nav list the footer floats in the middle
                    of the sidebar instead of at the bottom. */}
                {!isCollapsed && (
                    <div className="mt-auto px-5 py-4 border-t border-slate-100 dark:border-white/[0.05] space-y-3">
                        {settings['whitelabel_hide_powered_by'] !== 'true' && (
                            <div className="flex items-center gap-2 opacity-70">
                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest shrink-0">
                                    Powered by
                                </span>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="/logo.svg"
                                    alt="Mero CMS"
                                    className="h-4 w-auto brand-mark brand-mark-wordmark"
                                />
                            </div>
                        )}
                        <div className="flex items-center justify-between group cursor-default">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Engineered by</p>
                                <span className="text-xs font-black text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">BLENDWIT</span>
                            </div>
                            <ExternalLink size={13} className="text-slate-300 dark:text-slate-700 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
