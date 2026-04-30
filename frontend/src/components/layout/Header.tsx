import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { clearAuthToken } from '@/lib/auth';
import {
    Bell,
    Search,
    UserCircle,
    ChevronDown,
    Home,
    User,
    Settings,
    LogOut,
    ShieldCheck,
    Menu,
    Plus,
    Moon,
    Sun,
    Monitor,
    Fingerprint
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { useTheme } from 'next-themes';

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

interface HeaderProps {
    isCollapsed: boolean;
    onMobileMenuToggle?: () => void;
}

function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);
    if (!mounted) return <div className="w-8 h-8" />;

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
            aria-label="Toggle Theme"
        >
            {theme === 'dark' ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
        </button>
    );
}

export default function Header({ isCollapsed, onMobileMenuToggle }: HeaderProps) {
    const pathname = usePathname();
    const router = useRouter();
    const segments = pathname.split('/').filter(Boolean);
    const [user, setUser] = useState<any>(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);
    const bellRef = useRef<HTMLDivElement>(null);
    // Once we get an auth failure on /notifications, stop polling — there's
    // no point hammering the endpoint with the same stale token every 60s,
    // and the browser logs every 401 to the console regardless of whether
    // we catch it. The user's next sign-in remounts this component anyway.
    const notificationsUnauthorized = useRef(false);

    // Fetch user data
    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const data = await apiRequest('/auth/profile');
                    setUser(data);
                } catch (e: any) {
                    if (e?.status === 401) {
                        clearAuthToken();
                    }
                }
            }
        };
        fetchUser();
    }, []);

    // Fetch notifications. Bails out cleanly when:
    //   - the user has no token at all (truly logged out)
    //   - we already saw an auth error this session (stale token)
    //   - the route is one of the unauth pages (login / setup / reset)
    // This is what prevents the recurring `:3001/notifications 401` console
    // noise that shows up on /setup or right after a server restart wipes
    // sessions.
    const fetchNotifications = async () => {
        if (notificationsUnauthorized.current) return;
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;
        const path = typeof window !== 'undefined' ? window.location.pathname : '';
        if (path === '/' || path.startsWith('/setup') || path.startsWith('/reset-password')) return;
        try {
            const data = await apiRequest('/notifications');
            setNotifications(data);
            const countData = await apiRequest('/notifications/unread-count');
            setUnreadCount(countData.count);
        } catch (e: any) {
            // Stop the poll on auth failures — apiRequest already tried a
            // refresh and failed, so further attempts will just produce
            // the same 401.
            const msg = String(e?.message ?? '');
            if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
                notificationsUnauthorized.current = true;
            }
            console.debug('Failed to fetch notifications:', e);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
            if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
            fetchNotifications();
        } catch (e) {
            console.debug('Failed to mark notification as read:', e);
        }
    };

    const handleLogout = () => {
        clearAuthToken();
        router.push('/');
    };

    const { settings } = useSettings();

    return (
        <header className="sticky top-0 z-40 h-16 flex shrink-0 items-center border-b border-slate-200 dark:border-white/[0.06] bg-white/90 dark:bg-background/90 backdrop-blur-2xl transition-all duration-500 ease-in-out px-6">
            <div className="flex flex-1 items-center gap-x-4">
                {/* Mobile hamburger */}
                <button
                    type="button"
                    onClick={onMobileMenuToggle}
                    className="lg:hidden p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-white/5 rounded-xl transition-all"
                >
                    <Menu size={20} />
                </button>

                {/* Dashboard Indicator */}
                <div className="hidden lg:flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/30">
                        <Monitor size={16} strokeWidth={2} className="text-white" />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="text-[11px] font-black tracking-tight text-slate-900 dark:text-white uppercase">Admin Console</span>
                        <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase mt-0.5">V1.3.0</span>
                    </div>
                </div>

                <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden lg:block mx-2" />

                {/* Dynamic Breadcrumbs */}
                <nav className="hidden lg:flex items-center gap-1.5 text-[11px] font-bold tracking-wide">
                    <Link href="/dashboard" className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Dashboard</Link>
                    {segments.filter(s => s !== 'dashboard').map((segment, index, filteredSegments) => {
                        const href = `/dashboard/${filteredSegments.slice(0, index + 1).join('/')}`;
                        const isLast = index === filteredSegments.length - 1;
                        const label = segment === 'seo' ? 'SEO' : segment.replace(/-/g, ' ');

                        return (
                            <div key={segment} className="flex items-center gap-1.5">
                                <span className="text-slate-300 dark:text-slate-700">/</span>
                                {isLast ? (
                                    <span className="text-slate-800 dark:text-slate-200 font-black capitalize truncate max-w-[160px]">
                                        {label}
                                    </span>
                                ) : (
                                    <Link href={href} className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors capitalize whitespace-nowrap">
                                        {label}
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="ml-auto flex items-center gap-x-2">
                    {/* Search */}
                    <div className="relative group hidden xl:flex items-center">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Search size={14} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search..."
                            className="h-9 bg-slate-100 dark:bg-white/[0.06] rounded-xl py-0 pl-9 pr-4 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 border border-transparent focus:border-blue-300 dark:focus:border-blue-500/40 focus:ring-2 focus:ring-blue-600/10 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300 w-44 focus:w-60 outline-none"
                        />
                    </div>

                    <div className="h-6 w-px bg-slate-200 dark:bg-white/10 mx-1" />

                    <ThemeToggle />

                    <div className="relative" ref={bellRef}>
                        <button
                            type="button"
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all active:scale-95 duration-300"
                        >
                            <Bell size={20} strokeWidth={2.5} />
                            {unreadCount > 0 && (
                                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-500 ring-2 ring-white dark:ring-slate-950 animate-pulse"></span>
                            )}
                        </button>

                        {isNotificationsOpen && (
                            <div className="absolute right-0 mt-4 w-80 max-w-[calc(100vw-1rem)] origin-top-right rounded-[2.5rem] bg-white dark:bg-slate-900 p-2 shadow-2xl border border-slate-100 dark:border-white/5 animate-in zoom-in-95 slide-in-from-top-2 duration-300 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-50 dark:border-white/5 mb-1 flex justify-between items-center">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inbox</h3>
                                    {unreadCount > 0 && <span className="text-[9px] font-black bg-blue-600 text-white px-2 py-1 rounded-full">{unreadCount} New</span>}
                                </div>
                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                                    {notifications.length === 0 ? (
                                        <div className="py-12 text-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notification Clear</p>
                                        </div>
                                    ) : (
                                        notifications.map((n) => (
                                            <div
                                                key={n.id}
                                                onClick={() => n.link && router.push(n.link)}
                                                className={classNames(
                                                    "px-6 py-4 rounded-3xl transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 relative group mb-1",
                                                    !n.isRead ? "bg-blue-50/50 dark:bg-blue-500/10" : "opacity-80"
                                                )}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={classNames(
                                                        "h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 shadow-sm",
                                                        n.type === 'SUCCESS' ? "bg-emerald-500" :
                                                            n.type === 'DANGER' ? "bg-red-500" :
                                                                n.type === 'WARNING' ? "bg-amber-500" : "bg-blue-500"
                                                    )} />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-[11px] font-black text-slate-900 dark:text-white leading-tight truncate">{n.title}</h4>
                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 leading-snug">{n.message}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />

                    {/* Profile Dropdown */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className="flex items-center group p-1.5 rounded-[1.2rem] hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-300"
                        >
                            <div className="relative">
                                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-blue-600/30 transition-transform group-hover:scale-105">
                                    {user?.name?.slice(0, 2).toUpperCase() || 'US'}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-background shadow-sm"></div>
                            </div>
                            <div className="hidden lg:flex flex-col items-start ml-3.5 leading-none text-left">
                                <span className="text-[11px] font-black text-slate-950 dark:text-white tracking-tight">{user?.name || 'Loading...'}</span>
                                <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{user?.role?.name || 'Administrator'}</span>
                            </div>
                            <ChevronDown size={14} strokeWidth={3} className={classNames(
                                "hidden lg:block ml-3.5 text-slate-400 dark:text-slate-600 group-hover:text-slate-900 dark:group-hover:text-white transition-all duration-300",
                                isUserMenuOpen ? "rotate-180" : ""
                            )} />
                        </button>

                        {/* Dropdown Menu */}
                        {isUserMenuOpen && (
                            <div className="absolute right-0 mt-4 w-64 max-w-[calc(100vw-1rem)] origin-top-right rounded-[2.5rem] bg-white dark:bg-slate-900 p-2 shadow-2xl border border-slate-100 dark:border-white/5 animate-in zoom-in-95 slide-in-from-top-2 duration-300">
                                <div className="px-6 py-5 border-b border-slate-50 dark:border-white/5 mb-2">
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest leading-none">Global Account</p>
                                    <p className="text-xs font-black text-slate-950 dark:text-white mt-1.5 truncate">{user?.email || 'session@active.cms'}</p>
                                </div>
                                <div className="space-y-1">
                                    <Link
                                        href="/dashboard/profile"
                                        onClick={() => setIsUserMenuOpen(false)}
                                        className="flex items-center gap-4 px-5 py-3.5 text-xs font-black text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[1.8rem] transition-all group"
                                    >
                                        <User size={18} strokeWidth={2.5} className="group-hover:rotate-6 transition-transform" />
                                        Profile Settings
                                    </Link>
                                    <Link
                                        href="/dashboard/settings"
                                        onClick={() => setIsUserMenuOpen(false)}
                                        className="flex items-center gap-4 px-5 py-3.5 text-xs font-black text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[1.8rem] transition-all group"
                                    >
                                        <Settings size={18} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
                                        System Config
                                    </Link>
                                </div>
                                <div className="h-px bg-slate-50 dark:bg-white/5 my-2 mx-4" />
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-4 px-5 py-4 text-xs font-black text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-[1.8rem] transition-all group"
                                >
                                    <LogOut size={18} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                                    Destroy Session
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
