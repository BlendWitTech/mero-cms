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
    XMarkIcon
} from '@heroicons/react/24/outline';
import { useRouter, useSearchParams } from 'next/navigation';

import React, { useState, useEffect, Suspense } from 'react';
// ... (rest of imports unchanged, making sure Suspense is added)
import InviteUserModal from '@/components/users/InviteUserModal';
import ReactivationModal from '@/components/users/ReactivationModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import UserFilters from '@/components/users/UserFilters';
import TwoFactorSetup from '@/components/auth/TwoFactorSetup';
import { useNotification } from '@/context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import PermissionGuard from '@/components/auth/PermissionGuard';

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
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const response = await fetch('http://localhost:3001/users/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCurrentUser(data);
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        }
    };

    const fetchRoles = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const response = await fetch('http://localhost:3001/roles', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setRoles(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Failed to fetch roles:', error);
            setRoles([]);
        }
    };

    const fetchStats = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const response = await fetch('http://localhost:3001/users/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchUsers = async () => {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/';
            return;
        }
        try {
            const query = new URLSearchParams({
                ...filters,
                skip: pagination.skip.toString(),
                take: pagination.take.toString(),
            }).toString();
            const response = await fetch(`http://localhost:3001/users?${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/';
                    return;
                }
                throw new Error('Failed to fetch');
            }
            const data = await response.json();
            setUsers(Array.isArray(data.users) ? data.users : []);
            setTotalUsers(data.total || 0);
        } catch (error) {
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
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:3001/users/${id}/deactivate`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                showToast('User deactivated successfully', 'success');
                setIsDeactivateModalOpen(false);
                fetchUsers();
                fetchStats();
            } else {
                const err = await response.json();
                showToast(err.message || 'Failed to deactivate user', 'error');
            }
        } catch (error) {
            showToast('Connection error occurred', 'error');
        }
    };

    const handleReactivate = async (id: string, data: { newEmail?: string }) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:3001/users/${id}/reactivate`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                showToast('User reactivated successfully', 'success');
                setIsReactivateModalOpen(false);
                fetchUsers();
                fetchStats();
            } else {
                const err = await response.json();
                showToast(err.message || 'Failed to reactivate user', 'error');
            }
        } catch (error) {
            showToast('Connection error occurred', 'error');
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
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://localhost:3001/invitations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                showToast('Invitation sent successfully', 'success');
                setIsInviteModalOpen(false);
                fetchUsers();
                fetchStats();
            } else {
                const err = await response.json();
                showToast(err.message || 'Failed to send invitation', 'error');
            }
        } catch (error) {
            console.error('Failed to send invite:', error);
            showToast('Different error occurred', 'error');
        }
    };

    const handleResend = async (id: string) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:3001/invitations/${id}/resend`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                showToast('Invitation resent successfully', 'success');
            } else {
                const err = await response.json();
                showToast(err.message || 'Failed to resend invitation', 'error');
            }
        } catch (error) {
            console.error('Failed to resend invite:', error);
            showToast('Connection error occurred', 'error');
        }
    };

    const handleRevoke = async (id: string) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:3001/invitations/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                showToast('Invitation revoked successfully', 'success');
                fetchUsers();
                fetchStats();
            } else {
                const err = await response.json();
                showToast(err.message || 'Failed to revoke invitation', 'error');
            }
        } catch (error) {
            console.error('Failed to revoke invite:', error);
            showToast('Connection error occurred', 'error');
        }
    };

    const handle2faVerify = async (tokenInput: string) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://localhost:3001/auth/2fa/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ token: tokenInput }),
            });
            const data = await response.json();
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
        <div className="space-y-6">
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
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
                        User <span className="text-blue-600 font-bold">Management</span>
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 font-semibold tracking-tight">Manage your team members and their roles.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIs2faModalOpen(true)}
                        className="inline-flex items-center gap-x-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 transition-all active:scale-95 leading-none"
                    >
                        <ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
                        Configure 2FA
                    </button>
                    <PermissionGuard permission="users_create">
                        <button
                            onClick={() => setIsInviteModalOpen(true)}
                            className="inline-flex items-center gap-x-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 leading-none"
                        >
                            <PlusIcon className="h-4 w-4" strokeWidth={3} />
                            Invite New User
                        </button>
                    </PermissionGuard>
                </div>
            </div>

            {/* Detailed Filters Component */}
            <div className="px-2">
                <UserFilters onFilterChange={handleFilterChange} />
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 px-2">
                {[
                    { label: 'Total Users', value: stats.total, detail: 'Accounts', color: 'blue' },
                    { label: 'Standard Users', value: stats.active, detail: 'Verified', color: 'emerald' },
                    { label: 'New This Month', value: stats.recent, detail: 'Last 30d', color: 'purple' },
                    { label: 'Pending Invitations', value: stats.pending, detail: 'Awaiting', color: 'amber' },
                ].map((stat) => (
                    <div key={stat.label} className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-slate-200/50 group hover:shadow-xl hover:shadow-slate-200/40 hover:-translate-y-1 transition-all duration-500 cursor-default">
                        <div className={`absolute top-0 right-0 w-24 h-24 mt-[-20px] mr-[-20px] bg-${stat.color}-500/5 rounded-full blur-2xl group-hover:bg-${stat.color}-500/15 transition-all duration-700 group-hover:scale-150`}></div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">{stat.label}</p>
                        <div className="mt-2 flex items-baseline gap-2 relative z-10">
                            <p className="text-xl font-bold text-slate-900 tracking-tight group-hover:translate-x-0.5 transition-transform duration-500">{stat.value}</p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-${stat.color}-100 text-${stat.color}-600 ring-1 ring-${stat.color}-600/10 group-hover:scale-110 transition-transform duration-500`}>
                                {stat.detail}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Section */}
            <div className="mx-2 bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden text-sm font-medium">
                <div className="p-6 border-b border-slate-100 bg-slate-50/10 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 font-display">User Records</h3>
                    {selectedUsers.length > 0 && (
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
                            <span className="text-xs font-bold text-slate-500">{selectedUsers.length} selected</span>
                            <button className="text-xs font-bold text-red-600 hover:text-red-700">Bulk Delete</button>
                            <button className="text-xs font-bold text-blue-600 hover:text-blue-700">Change Role</button>
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="pl-6 py-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-600/20"
                                        checked={selectedUsers.length === users.length}
                                        onChange={toggleAll}
                                    />
                                </th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">User</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">Role</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">Status</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">Last Active</th>
                                <th className="pr-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map((user) => {
                                const roleName = user.type === 'User' ? user.role?.name : user.roleId;

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
                                        user.status === 'DEACTIVATED' ? 'bg-slate-50/80 grayscale-[0.2]' : 'hover:bg-slate-50/50'
                                    )}>
                                        <td className="pl-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-600/20"
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={() => toggleUser(user.id)}
                                            />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className={classNames(
                                                        "h-10 w-10 rounded-xl flex items-center justify-center text-slate-400 ring-1 ring-slate-200",
                                                        user.status === 'DEACTIVATED' ? 'bg-slate-200' : 'bg-slate-100'
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
                                                            user.status === 'DEACTIVATED' ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-900'
                                                        )}>{user.name || user.email.split('@')[0]}</p>
                                                        {user.twoFactorEnabled && (
                                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-50 text-[8px] font-black text-emerald-600 ring-1 ring-emerald-600/10 uppercase tracking-tighter" title="2FA Active">
                                                                <ShieldCheckIcon className="h-2 w-2" strokeWidth={3} />
                                                                2FA
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-semibold text-slate-500 mt-1">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={classNames(
                                                "inline-flex items-center gap-x-1.5 rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ring-1 ring-inset",
                                                user.status === 'DEACTIVATED' ? 'bg-slate-100 text-slate-400 ring-slate-200' : roleInfo.color
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
                                                    user.status === 'Pending' ? 'text-blue-600' :
                                                        user.status === 'DEACTIVATED' ? 'text-red-600' : 'text-slate-700'
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
                                                    <button onClick={() => handleResend(user.id)} className="px-3 py-1.5 text-[10px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-blue-100 uppercase tracking-widest whitespace-nowrap">Resend</button>
                                                    <button onClick={() => handleRevoke(user.id)} className="px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all uppercase tracking-widest">Revoke</button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-2">
                                                    {user.status === 'DEACTIVATED' ? (
                                                        <button
                                                            onClick={() => { setUserToReactivate(user); setIsReactivateModalOpen(true); }}
                                                            className="px-3 py-1.5 text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-emerald-100 uppercase tracking-widest"
                                                        >
                                                            Reactivate
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center gap-1">
                                                            {/* Only show actions if current user is hierarchical superior and NOT targeting themselves */}
                                                            {currentUser && currentUser.id !== user.id && (currentUser.role.level === 0 || (user.role?.level !== undefined && currentUser.role.level < user.role.level)) ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleDeactivate(user)}
                                                                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all group/action"
                                                                        title="Deactivate Account"
                                                                    >
                                                                        <XMarkIcon className="h-5 w-5" />
                                                                    </button>
                                                                    <button className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all">
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

                <div className="p-6 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500">
                        Showing <span className="text-slate-900">{startItem}</span> to <span className="text-slate-900">{endItem}</span> of <span className="text-slate-900">{totalUsers}</span> results
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrevPage}
                            disabled={pagination.skip === 0}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={handleNextPage}
                            disabled={pagination.skip + pagination.take >= totalUsers}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
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
