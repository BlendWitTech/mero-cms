import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { clearAuthToken } from '@/lib/auth';
import {
    BellIcon,
    MagnifyingGlassIcon,
    UserCircleIcon,
    ChevronDownIcon,
    HomeIcon,
    UserIcon,
    Cog8ToothIcon,
    ArrowRightOnRectangleIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useSettings } from '@/context/SettingsContext';

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

interface HeaderProps {
    isCollapsed: boolean;
}

export default function Header({ isCollapsed }: HeaderProps) {
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

    // Fetch user data
    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const data = await apiRequest('/auth/profile');
                    setUser(data);
                } catch (e: any) {
                    // Silently handle network errors - backend might not be running
                    // This is expected during development
                    if (e?.status === 401) {
                        clearAuthToken();
                    }
                    console.debug('Backend not available:', e);
                }
            }
        };
        fetchUser();
    }, []);

    // Fetch notifications
    const fetchNotifications = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const data = await apiRequest('/notifications');
                setNotifications(data);

                const countData = await apiRequest('/notifications/unread-count');
                setUnreadCount(countData.count);
            } catch (e) {
                console.debug('Failed to fetch notifications:', e);
            }
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Polling every minute
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
        <header className={classNames(
            "sticky top-0 z-40 flex shrink-0 items-center border-b border-slate-200/60 bg-white/90 backdrop-blur-3xl transition-all duration-500 ease-out shadow-sm shadow-slate-200/20",
            isCollapsed ? "h-14 px-8" : "h-16 px-6"
        )}>
            <div className="flex flex-1 items-center gap-x-6">
                {/* Dynamic Breadcrumbs */}
                <nav className="hidden md:flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 font-display">
                    <Link href="/dashboard" className="hover:text-blue-600 transition-colors flex items-center gap-1.5 shrink-0">
                        <HomeIcon className="h-3 w-3" strokeWidth={2.5} />
                        {settings['site_title'] || 'CMS'}
                    </Link>
                    {segments.filter(s => s !== 'dashboard').map((segment, index, filteredSegments) => {
                        const href = `/dashboard/${filteredSegments.slice(0, index + 1).join('/')}`;
                        const isLast = index === filteredSegments.length - 1;
                        const label = segment === 'seo' ? 'SEO' : segment.replace(/-/g, ' ');

                        return (
                            <div key={segment} className="flex items-center space-x-2">
                                <span className="text-slate-400 font-normal">/</span>
                                {isLast ? (
                                    <span className="text-slate-900 truncate max-w-[150px]">
                                        {label}
                                    </span>
                                ) : (
                                    <Link href={href} className="hover:text-blue-600 cursor-pointer transition-colors whitespace-nowrap">
                                        {label}
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="h-4 w-px bg-slate-200/50 hidden md:block" />

                {/* Command-Palette Style Search */}
                <div className="relative flex-1 max-w-[280px] group hidden sm:block">
                    <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-4 w-4 text-slate-500 group-focus-within:text-blue-600 transition-all duration-300" />
                    </div>
                    <input
                        type="text"
                        placeholder="Quick search... (⌘K)"
                        className="w-[200px] border-none group-focus-within:w-full bg-slate-50/50 rounded-xl py-2 pl-10 pr-4 text-[11px] font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white focus:border-blue-600/20 transition-all duration-500"
                    />
                </div>

                <div className="ml-auto flex items-center gap-x-4">
                    <div className="relative" ref={bellRef}>
                        <button
                            type="button"
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            className="relative p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all active:scale-95 duration-300"
                        >
                            <BellIcon className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-blue-600 ring-2 ring-white animate-pulse"></span>
                            )}
                        </button>

                        {isNotificationsOpen && (
                            <div className="absolute right-0 mt-3 w-80 origin-top-right rounded-3xl bg-white p-2 shadow-2xl shadow-slate-900/10 border border-slate-100 ring-1 ring-black/5 animate-in zoom-in-95 slide-in-from-top-2 duration-300 overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-50 mb-1 flex justify-between items-center">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notifications</h3>
                                    {unreadCount > 0 && <span className="text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">{unreadCount} New</span>}
                                </div>
                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {notifications.length === 0 ? (
                                        <div className="py-8 text-center">
                                            <p className="text-[10px] font-bold text-slate-400">All caught up!</p>
                                        </div>
                                    ) : (
                                        notifications.map((n) => (
                                            <div
                                                key={n.id}
                                                onClick={() => n.link && router.push(n.link)}
                                                className={classNames(
                                                    "px-4 py-3 rounded-2xl transition-all cursor-pointer hover:bg-slate-50 relative group",
                                                    !n.isRead ? "bg-blue-50/30" : "opacity-80"
                                                )}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={classNames(
                                                        "h-2 w-2 rounded-full mt-1.5 shrink-0",
                                                        n.type === 'SUCCESS' ? "bg-emerald-500" :
                                                            n.type === 'DANGER' ? "bg-red-500" :
                                                                n.type === 'WARNING' ? "bg-amber-500" : "bg-blue-500"
                                                    )} />
                                                    <div className="flex-1">
                                                        <h4 className="text-[11px] font-black text-slate-900 leading-tight">{n.title}</h4>
                                                        <p className="text-[10px] font-medium text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                                                        <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">{new Date(n.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                    {!n.isRead && (
                                                        <button
                                                            onClick={(e) => handleMarkAsRead(n.id, e)}
                                                            className="text-[9px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            Mark read
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-7 w-px bg-slate-200/50" />

                    {/* Profile Dropdown */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className="flex items-center group p-1.5 rounded-2xl hover:bg-slate-50 transition-all duration-300"
                        >
                            <div className="relative">
                                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-[1px] shadow-lg shadow-blue-500/10 transition-transform group-hover:scale-105">
                                    <div className="h-full w-full rounded-[11px] bg-white flex items-center justify-center overflow-hidden">
                                        <div className="h-full w-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-blue-600">
                                            {user?.name?.slice(0, 2).toUpperCase() || 'US'}
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-[0_0_6px_rgba(16,185,129,0.3)]"></div>
                            </div>
                            <div className="hidden lg:flex flex-col items-start ml-3 leading-none transition-transform group-hover:translate-x-0.5 duration-300 text-left">
                                <span className="text-[11px] font-bold text-slate-900 font-display">{user?.name || 'User'}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{user?.role?.name || 'Member'}</span>
                            </div>
                            <ChevronDownIcon className={classNames(
                                "hidden lg:block ml-3 h-3 w-3 text-slate-400 group-hover:text-slate-900 transition-all duration-300",
                                isUserMenuOpen ? "rotate-180" : ""
                            )} />
                        </button>

                        {/* Dropdown Menu */}
                        {isUserMenuOpen && (
                            <div className="absolute right-0 mt-3 w-56 origin-top-right rounded-3xl bg-white p-2 shadow-2xl shadow-slate-900/10 border border-slate-100 ring-1 ring-black/5 animate-in zoom-in-95 slide-in-from-top-2 duration-300">
                                <div className="px-4 py-3 border-b border-slate-50 mb-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Signed in as</p>
                                    <p className="text-xs font-bold text-slate-900 mt-1 truncate">{user?.email || 'user@example.com'}</p>
                                </div>
                                <Link
                                    href="/dashboard/profile"
                                    onClick={() => setIsUserMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all group"
                                >
                                    <UserIcon className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
                                    My Profile
                                </Link>
                                <Link
                                    href="/dashboard/profile?tab=preferences"
                                    onClick={() => setIsUserMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all group"
                                >
                                    <Cog8ToothIcon className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
                                    User Settings
                                </Link>
                                <div className="h-px bg-slate-50 my-1" />
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-2xl transition-all group"
                                >
                                    <ArrowRightOnRectangleIcon className="h-4 w-4 text-red-400 group-hover:text-red-500" />
                                    Logout Session
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
