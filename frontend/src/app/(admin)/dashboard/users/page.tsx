'use client';

import {
    MagnifyingGlassIcon,
    FunnelIcon,
    PlusIcon,
    EllipsisVerticalIcon,
    ChevronDownIcon,
    UserCircleIcon,
    CheckBadgeIcon,
    ShieldCheckIcon,
    KeyIcon,
    XMarkIcon,
    UsersIcon
} from '@heroicons/react/24/outline';
import { useRouter, useSearchParams } from 'next/navigation';

import React, { useState, useEffect, Suspense } from 'react';
// ... (rest of imports unchanged, making sure Suspense is added)
import { apiRequest } from '@/lib/api';
import InviteUserModal from '@/components/users/InviteUserModal';
import ReactivationModal from '@/components/users/ReactivationModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import UserFilters from '@/components/users/UserFilters';
import TwoFactorSetup from '@/components/auth/TwoFactorSetup';
import { useNotification } from '@/context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import PermissionGuard from '@/components/auth/PermissionGuard';
import PageHeader from '@/components/ui/PageHeader';

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

function UsersPageContent() {
    const { showToast } = useNotification();
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [stats, setStats] = useState({ total: 0, active: 0, recent: 0, pending: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [is2faModalOpen, setIs2faModalOpen] = useState(false);
    const [filters, setFilters] = useState({ search: '', role: '', status: '', security: '' });
    const [pagination, setPagination] = useState({ skip: 0, take: 10 });

    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('action') === 'new') {
            setIsInviteModalOpen(true);
            router.replace('/dashboard/users', { scroll: false });
        }
    }, [searchParams]);

    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
    const [userToReactivate, setUserToReactivate] = useState<any>(null);
    const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
    const [userToDeactivate, setUserToDeactivate] = useState<any>(null);

    const fetchCurrentUser = async () => {
        try {
            const data = await apiRequest('/users/profile');
            setCurrentUser(data);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        }
    };

    const fetchRoles = async () => {
        try {
            const data = await apiRequest('/roles');
            setRoles(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch roles:', error);
            setRoles([]);
        }
    };

    const fetchStats = async () => {
        try {
            const data = await apiRequest('/users/stats');
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const query = new URLSearchParams({
                ...filters,
                skip: pagination.skip.toString(),
                take: pagination.take.toString(),
            }).toString();
            const data = await apiRequest(`/users?${query}`);
            setUsers(Array.isArray(data.users) ? data.users : []);
            setTotalUsers(data.total || 0);
        } catch (error: any) {
            if (error?.status === 401) {
                window.location.href = '/';
                return;
            }
            console.error('Failed to fetch users:', error);
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCurrentUser();
        fetchStats();
        fetchRoles();
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [filters, pagination]);

    const handleDeactivate = (user: any) => {
        setUserToDeactivate(user);
        setIsDeactivateModalOpen(true);
    };

    const performDeactivate = async () => {
        if (!userToDeactivate) return;
        const id = userToDeactivate.id;
        try {
            await apiRequest(`/users/${id}/deactivate`, { method: 'PATCH' });
            showToast('User deactivated successfully', 'success');
            setIsDeactivateModalOpen(false);
            fetchUsers();
            fetchStats();
        } catch (error: any) {
            showToast(error.message || 'Failed to deactivate user', 'error');
        }
    };

    const handleReactivate = async (id: string, data: { newEmail?: string }) => {
        try {
            await apiRequest(`/users/${id}/reactivate`, { method: 'PATCH', body: data });
            showToast('User reactivated successfully', 'success');
            setIsReactivateModalOpen(false);
            fetchUsers();
            fetchStats();
        } catch (error: any) {
            showToast(error.message || 'Failed to reactivate user', 'error');
        }
    };

    const handleUnlock = async (user: any) => {
        try {
            await apiRequest(`/users/${user.id}/unlock`, { method: 'PATCH' });
            showToast(`Unlocked ${user.name || user.email}`, 'success');
            fetchUsers();
            fetchStats();
        } catch (error: any) {
            showToast(error.message || 'Failed to unlock user', 'error');
        }
    };

    const toggleUser = (id: string) => {
        if (selectedUsers.includes(id)) {
            setSelectedUsers(selectedUsers.filter(u => u !== id));
        } else {
            setSelectedUsers([...selectedUsers, id]);
        }
    };

    const toggleAll = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.map(u => u.id));
        }
    };

    const handleInvite = async (data: any) => {
        try {
            await apiRequest('/invitations', { method: 'POST', body: data });
            showToast('Invitation sent successfully', 'success');
            setIsInviteModalOpen(false);
            fetchUsers();
            fetchStats();
        } catch (error: any) {
            console.error('Failed to send invite:', error);
            showToast(error.message || 'Failed to send invitation', 'error');
        }
    };

    const handleResend = async (id: string) => {
        try {
            await apiRequest(`/invitations/${id}/resend`, { method: 'POST' });
            showToast('Invitation resent successfully', 'success');
        } catch (error: any) {
            console.error('Failed to resend invite:', error);
            showToast(error.message || 'Failed to resend invitation', 'error');
        }
    };

    const handleRevoke = async (id: string) => {
        try {
            await apiRequest(`/invitations/${id}`, { method: 'DELETE' });
            showToast('Invitation revoked successfully', 'success');
            fetchUsers();
            fetchStats();
        } catch (error: any) {
            console.error('Failed to revoke invite:', error);
            showToast(error.message || 'Failed to revoke invitation', 'error');
        }
    };

    const handle2faVerify = async (tokenInput: string) => {
        try {
            const data = await apiRequest('/auth/2fa/verify', {
                method: 'POST',
                body: { token: tokenInput },
            });
            if (data.success) {
                fetchUsers();
                fetchStats();
                return true;
            }
            return false;
        } catch (error) {
            console.error('2FA Verification failed:', error);
            return false;
        }
    };

    const handleFilterChange = (newFilters: any) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setPagination(prev => ({ ...prev, skip: 0 })); // Reset skip on filter change
    };

    const handleNextPage = () => {
        setPagination(prev => ({ ...prev, skip: prev.skip + prev.take }));
    };

    const handlePrevPage = () => {
        setPagination(prev => ({ ...prev, skip: Math.max(0, prev.skip - prev.take) }));
    };

    const currentPage = Math.floor(pagination.skip / pagination.take) + 1;
    const totalPages = Math.ceil(totalUsers / pagination.take);
    const startItem = totalUsers === 0 ? 0 : pagination.skip + 1;
    const endItem = Math.min(pagination.skip + pagination.take, totalUsers);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <InviteUserModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                onInvite={handleInvite}
            />
            <TwoFactorSetup
                isOpen={is2faModalOpen}
                onClose={() => setIs2faModalOpen(false)}
                onVerify={handle2faVerify}
            />
            <ReactivationModal
                isOpen={isReactivateModalOpen}
                onClose={() => setIsReactivateModalOpen(false)}
                onReactivate={(data) => handleReactivate(userToReactivate.id, data)}
                user={userToReactivate}
                currentUser={currentUser}
            />
            <ConfirmationModal
                isOpen={isDeactivateModalOpen}
                onClose={() => setIsDeactivateModalOpen(false)}
                onConfirm={performDeactivate}
                title="Deactivate User Account"
                message={`Are you sure you want to deactivate ${userToDeactivate?.name || userToDeactivate?.email}? This user will no longer be able to log in until reactivated.`}
                confirmText="Deactivate Account"
                variant="danger"
            />
            <PageHeader
                title="User"
                accent="Management"
                subtitle="Manage your team members and their roles."
                actions={
                    <>
                        <button
                            onClick={() => setIs2faModalOpen(true)}
                            className="btn-outline px-4 py-2.5 text-[11px]"
                        >
                            <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                            2FA
                        </button>
                        <PermissionGuard permission="users_create">
                            <button
                                onClick={() => setIsInviteModalOpen(true)}
                                className="btn-primary px-6 py-3 text-sm"
                            >
                                <PlusIcon className="h-4 w-4" strokeWidth={3} />
                                Invite User
                            </button>
                        </PermissionGuard>
                    </>
                }
            />

            {/* Stats Summary */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {isLoading ? (
                    [1, 2, 3, 4].map((i) => <div key={i} className="content-skeleton h-28 rounded-2xl" />)
                ) : [
                    { label: 'Total Users', value: stats.total, detail: 'Accounts', icon: UsersIcon, color: 'blue' },
                    { label: 'Active Now', value: stats.active, detail: 'Verified', icon: ShieldCheckIcon, color: 'emerald' },
                    { label: 'New This Month', value: stats.recent, detail: 'Last 30d', icon: UserCircleIcon, color: 'purple' },
                    { label: 'Invitations', value: stats.pending, detail: 'Awaiting', icon: KeyIcon, color: 'amber' },
                ].map((stat) => {
                    const StatIcon = stat.icon;
                    return (
                        <div key={stat.label} className="group relative overflow-hidden rounded-[2rem] bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-6 shadow-2xl shadow-slate-900/5 border border-slate-100 dark:border-white/[0.06] hover:-translate-y-1 transition-all duration-500">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
                                    <span className={`inline-flex items-center mt-2 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-${stat.color}-50 dark:bg-${stat.color}-900/30 text-${stat.color}-600 dark:text-${stat.color}-400`}>
                                        {stat.detail}
                                    </span>
                                </div>
                                <div className={`p-3 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-600 dark:text-${stat.color}-400 group-hover:bg-${stat.color}-600 group-hover:text-white transition-all duration-500`}>
                                    <StatIcon className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <UserFilters inline onFilterChange={handleFilterChange} />

            {/* Unified Content Card */}
            <div className="bg-white/50 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-900/5 border border-slate-100 dark:border-white/[0.06] overflow-hidden transition-all duration-500">
                <div className="p-8 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">User Database</h3>
                    {selectedUsers.length > 0 && (
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{selectedUsers.length} selected</span>
                            <div className="flex items-center gap-2">
                                <button className="btn-destructive px-3 py-1.5 text-[10px]">Bulk Delete</button>
                                <button className="btn-outline px-3 py-1.5 text-[10px]">Change Role</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                                <th className="pl-10 py-5 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded-md border-slate-300 dark:border-white/10 dark:bg-slate-950 text-blue-600 focus:ring-blue-600/20"
                                        checked={selectedUsers.length === users.length && users.length > 0}
                                        onChange={toggleAll}
                                    />
                                </th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">User Details</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Security Role</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Activity</th>
                                <th className="pr-10 py-5 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                            {isLoading ? (
                                [1, 2, 3, 4, 5].map((index) => (
                                    <tr key={index}>
                                        <td className="pl-6 py-4">
                                            <div className="h-4 bg-slate-200 rounded-full w-4/5 animate-pulse" />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="h-4 bg-slate-200 rounded-full w-32 animate-pulse" />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="h-4 bg-slate-200 rounded-full w-20 animate-pulse" />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="h-4 bg-slate-200 rounded-full w-24 animate-pulse" />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="h-4 bg-slate-200 rounded-full w-16 animate-pulse ml-auto" />
                                        </td>
                                        <td className="pr-6 py-4 text-right">
                                            <div className="h-4 bg-slate-200 rounded-full w-12 ml-auto animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center text-slate-500">
                                        No users found for the current filter.
                                    </td>
                                </tr>
                            ) : users.map((user) => {
                                const roleName = user.type === 'User'
                                    ? user.role?.name
                                    : (roles.find((r: any) => r.id === user.roleId)?.name ?? user.roleId);

                                // Dynamic Mapping for UI aesthetics
                                const roleStyles: Record<string, { icon: any, color: string }> = {
                                    'Super Admin': { icon: ShieldCheckIcon, color: 'text-purple-600 bg-purple-100 ring-purple-600/20' },
                                    'Admin': { icon: UserCircleIcon, color: 'text-blue-600 bg-blue-100 ring-blue-600/20' },
                                    'Editor': { icon: CheckBadgeIcon, color: 'text-emerald-600 bg-emerald-100 ring-emerald-600/20' },
                                    'Author': { icon: KeyIcon, color: 'text-amber-600 bg-amber-100 ring-amber-600/20' },
                                };

                                const roleInfo = roleStyles[roleName] || { icon: UserCircleIcon, color: 'text-slate-600 bg-slate-100 ring-slate-600/20' };

                                return (
                                    <tr key={user.id} className={classNames(
                                        "group transition-colors",
                                        user.status === 'DEACTIVATED' ? 'bg-slate-50/80 dark:bg-slate-900/60 grayscale-[0.2]' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
                                    )}>
                                        <td className="pl-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded-md border-slate-300 dark:border-white/10 dark:bg-slate-950 text-blue-600 focus:ring-blue-600/20"
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={() => toggleUser(user.id)}
                                            />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className={classNames(
                                                        "h-10 w-10 rounded-xl flex items-center justify-center text-slate-400 ring-1 ring-slate-200 dark:ring-white/10",
                                                        user.status === 'DEACTIVATED' ? 'bg-slate-200 dark:bg-slate-800' : 'bg-slate-100 dark:bg-slate-900'
                                                    )}>
                                                        <UserCircleIcon className="h-6 w-6" />
                                                    </div>
                                                    {user.ipWhitelist?.length > 0 && (
                                                        <div className="absolute -top-1.5 -right-1.5 p-1 bg-blue-600 rounded-lg shadow-lg ring-2 ring-white group-hover:scale-110 transition-transform cursor-help" title="IP Restricted Access">
                                                            <ShieldCheckIcon className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className={classNames(
                                                            "text-sm font-bold leading-none",
                                                            user.status === 'DEACTIVATED' ? 'text-slate-500 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-600' : 'text-slate-900 dark:text-white'
                                                        )}>{user.name || user.email.split('@')[0]}</p>
                                                        {user.twoFactorEnabled && (
                                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-50 text-[8px] font-black text-emerald-600 ring-1 ring-emerald-600/10 uppercase tracking-tighter" title="2FA Active">
                                                                <ShieldCheckIcon className="h-2 w-2" strokeWidth={3} />
                                                                2FA
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={classNames(
                                                "inline-flex items-center gap-x-1.5 rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ring-1 ring-inset",
                                                user.status === 'DEACTIVATED' ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 ring-slate-200 dark:ring-white/10' : roleInfo.color
                                            )}>
                                                <roleInfo.icon className="h-3 w-3" />
                                                {roleName}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={classNames(
                                                    "h-1.5 w-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]",
                                                    user.status === 'ACTIVE' || (user.type === 'User' && user.status !== 'DEACTIVATED') ? 'bg-emerald-500 shadow-emerald-500/40' :
                                                        user.status === 'Pending' ? 'bg-blue-500 animate-pulse' :
                                                            user.status === 'DEACTIVATED' ? 'bg-red-400' : 'bg-slate-300'
                                                )}></div>
                                                <span className={classNames(
                                                    "text-xs font-bold",
                                                    user.status === 'Pending' ? 'text-blue-600 dark:text-blue-400' :
                                                        user.status === 'DEACTIVATED' ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'
                                                )}>{user.type === 'User' ? (user.status === 'DEACTIVATED' ? 'Deactivated' : 'Active') : user.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                {user.lastActive ? `${formatDistanceToNow(new Date(user.lastActive))} ago` : 'NEVER'}
                                            </p>
                                        </td>
                                        <td className="pr-6 py-4 text-right">
                                            {user.status === 'Pending' ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleResend(user.id)} className="btn-outline px-3 py-1.5 text-[10px]">Resend</button>
                                                    <button onClick={() => handleRevoke(user.id)} className="btn-ghost px-3 py-1.5 text-[10px] text-slate-400 hover:text-red-600">Revoke</button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-2">
                                                    {user.status === 'DEACTIVATED' ? (
                                                        <button
                                                            onClick={() => { setUserToReactivate(user); setIsReactivateModalOpen(true); }}
                                                            className="btn-outline px-3 py-1.5 text-[10px] text-emerald-600 hover:text-emerald-700 border-emerald-100 hover:border-emerald-200"
                                                        >
                                                            Reactivate
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center gap-1">
                                                            {/* Only show actions if current user is hierarchical superior and NOT targeting themselves */}
                                                            {currentUser && currentUser.id !== user.id && (currentUser.role.level === 0 || (user.role?.level !== undefined && currentUser.role.level < user.role.level)) ? (
                                                                <>
                                                                    {/* Unlock: only surfaced when the user is currently inside their lockout window. */}
                                                                    {user.lockoutUntil && new Date(user.lockoutUntil) > new Date() && (
                                                                        <button
                                                                            onClick={() => handleUnlock(user)}
                                                                            className="btn-outline px-3 py-1.5 text-[10px] text-amber-600 hover:text-amber-700 border-amber-200 hover:border-amber-300"
                                                                            title="Clear failed-login lockout"
                                                                        >
                                                                            Unlock
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => handleDeactivate(user)}
                                                                        className="btn-ghost p-2 text-slate-400 hover:text-red-600"
                                                                        title="Deactivate Account"
                                                                    >
                                                                        <XMarkIcon className="h-5 w-5" />
                                                                    </button>
                                                                    <button className="btn-ghost p-2 text-slate-400">
                                                                        <EllipsisVerticalIcon className="h-5 w-5" />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <span className="p-2 text-slate-300">
                                                                    <ShieldCheckIcon className="h-5 w-5 opacity-40" />
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        Showing <span className="text-slate-900 dark:text-white">{startItem}</span> to <span className="text-slate-900 dark:text-white">{endItem}</span> of <span className="text-slate-900 dark:text-white">{totalUsers}</span> results
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrevPage}
                            disabled={pagination.skip === 0}
                            className="btn-outline px-4 py-2 text-xs"
                        >
                            Previous
                        </button>
                        <button
                            onClick={handleNextPage}
                            disabled={pagination.skip + pagination.take >= totalUsers}
                            className="btn-primary px-4 py-2 text-xs"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function UsersPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        }>
            <UsersPageContent />
        </Suspense>
    );
}
