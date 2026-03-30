'use client';

import React, { useState, useEffect, Suspense } from 'react';
import {
    ShieldCheckIcon,
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    UsersIcon,
    KeyIcon,
    GlobeAltIcon,
    PhotoIcon,
    DocumentTextIcon,
    CommandLineIcon,
    PaintBrushIcon,
    IdentificationIcon,
    PresentationChartLineIcon,
    ArchiveBoxIcon,
    UserGroupIcon,
    MagnifyingGlassIcon,
    MusicalNoteIcon,
    FilmIcon,
    BeakerIcon,
    BoltIcon,
    AcademicCapIcon,
    GlobeAmericasIcon,
    ChatBubbleBottomCenterTextIcon,
    RocketLaunchIcon,
    ComputerDesktopIcon,
    SpeakerWaveIcon,
    QueueListIcon,
    Squares2X2Icon,
    BuildingOfficeIcon,
    CreditCardIcon,
    Cog6ToothIcon,
    BriefcaseIcon,
    CloudArrowUpIcon,
    FingerPrintIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { useNotification } from '@/context/NotificationContext';
import { apiRequest } from '@/lib/api';
import RoleForm from '@/components/roles/RoleForm';

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

function RolesPageContent() {
    const { showToast } = useNotification();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Derived state
    const view = searchParams.get('action') === 'new' || searchParams.get('action') === 'edit' ? 'editor' : 'list';
    const actionId = searchParams.get('id');

    const [roles, setRoles] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isLoading, setIsLoading] = useState(true);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        variant: 'danger' | 'info' | 'success';
        isAlert: boolean;
        onConfirm?: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'danger',
        isAlert: false,
    });

    const iconMap: Record<string, any> = {
        ShieldCheckIcon,
        PencilSquareIcon,
        PaintBrushIcon,
        UsersIcon,
        UserGroupIcon,
        PresentationChartLineIcon,
        MagnifyingGlassIcon,
        KeyIcon,
        PhotoIcon,
        FilmIcon,
        MusicalNoteIcon,
        DocumentTextIcon,
        CommandLineIcon,
        BriefcaseIcon,
        RocketLaunchIcon,
        AcademicCapIcon,
        BeakerIcon,
        GlobeAmericasIcon,
        BoltIcon,
        ChatBubbleBottomCenterTextIcon,
        ComputerDesktopIcon,
        SpeakerWaveIcon,
        QueueListIcon,
        BuildingOfficeIcon,
        CreditCardIcon,
        Cog6ToothIcon,
        GlobeAltIcon
    };

    const fetchRoles = async () => {
        setIsLoading(true);
        try {
            const data = await apiRequest('/roles');
            if (Array.isArray(data)) {
                setRoles(data);
            } else {
                setRoles([]);
            }
        } catch (error) {
            console.error('Failed to fetch roles:', error);
            showToast('Failed to load roles', 'error');
            setRoles([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const deleteRoleAPI = async (id: string) => {
        try {
            await apiRequest(`/roles/${id}`, { method: 'DELETE' });
            showToast('Role deleted successfully', 'success');
            fetchRoles();
        } catch (error: any) {
            console.error('Failed to delete role:', error);
            showToast(error.message || 'Failed to delete role', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        const roleToDelete = roles.find(r => r.id === id);
        if (roleToDelete?.users?.length > 0) {
            setConfirmModal({
                isOpen: true,
                title: 'Cannot Delete Role',
                message: 'This role is currently assigned to one or more users. To preserve system integrity, please reassign these users to a different role before deleting this one.',
                variant: 'info',
                isAlert: true,
            });
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: 'Delete Role?',
            message: `Are you sure you want to delete the "${roleToDelete?.name}" role? This action cannot be undone.`,
            variant: 'danger',
            isAlert: false,
            onConfirm: () => {
                deleteRoleAPI(id);
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleSave = async (data: any) => {
        try {
            const url = actionId ? `/roles/${actionId}` : '/roles';
            const method = actionId ? 'PATCH' : 'POST';

            await apiRequest(url, {
                method,
                body: data,
                skipNotification: true
            });

            showToast(`Role ${actionId ? 'updated' : 'created'} successfully`, 'success');
            router.push('/dashboard/roles');
            fetchRoles();
        } catch (error: any) {
            showToast(error.message || `Failed to ${actionId ? 'update' : 'create'} role`, 'error');
            throw error;
        }
    };

    const handleCreate = () => {
        router.push('/dashboard/roles?action=new');
    };

    const handleEdit = (role: any) => {
        router.push(`/dashboard/roles?action=edit&id=${role.id}`);
    };

    const permissionIcons = [
        { key: 'users_view', icon: UsersIcon, label: 'View Users' },
        { key: 'users_create', icon: PlusIcon, label: 'Create Users' },
        { key: 'users_edit', icon: PencilSquareIcon, label: 'Edit Users' },
        { key: 'users_delete', icon: TrashIcon, label: 'Delete Users' },
        { key: 'roles_view', icon: ShieldCheckIcon, label: 'View Roles' },
        { key: 'roles_create', icon: PlusIcon, label: 'Create Roles' },
        { key: 'roles_edit', icon: PencilSquareIcon, label: 'Edit Roles' },
        { key: 'roles_delete', icon: TrashIcon, label: 'Delete Roles' },
        { key: 'content_view', icon: DocumentTextIcon, label: 'View Content' },
        { key: 'content_create', icon: PlusIcon, label: 'Create Content' },
        { key: 'content_edit', icon: PencilSquareIcon, label: 'Edit Content' },
        { key: 'content_delete', icon: TrashIcon, label: 'Delete Content' },
        { key: 'media_view', icon: PhotoIcon, label: 'View Media' },
        { key: 'media_upload', icon: CloudArrowUpIcon, label: 'Upload Media' },
        { key: 'media_delete', icon: TrashIcon, label: 'Delete Media' },
        { key: 'settings_edit', icon: Cog6ToothIcon, label: 'Manage Settings' },
        { key: 'audit_view', icon: FingerPrintIcon, label: 'View Audit Logs' },
        { key: 'analytics_view', icon: ChartBarIcon, label: 'View Analytics' },
        { key: 'seo_manage', icon: GlobeAltIcon, label: 'Manage SEO' }
    ];

    const renderPermissionBadges = (role: any, maxVisible: number = 3) => {
        if (role.name === 'Super Admin') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-[10px] font-black text-indigo-600 uppercase tracking-widest ring-1 ring-indigo-600/10">
                    <GlobeAltIcon className="h-3 w-3" />
                    Full Access
                </span>
            );
        }

        const enabledPermissions = permissionIcons.filter(perm => role.permissions?.[perm.key]);
        const visiblePerms = enabledPermissions.slice(0, maxVisible);
        const remainingCount = enabledPermissions.length - maxVisible;

        if (enabledPermissions.length === 0) {
            return <span className="text-[10px] font-medium text-slate-400">No permissions assigned</span>;
        }

        return (
            <>
                {visiblePerms.map(perm => (
                    <span key={perm.key} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[10px] font-black text-blue-600 uppercase tracking-widest ring-1 ring-blue-600/10 transition-colors group-hover:bg-blue-100">
                        <perm.icon className="h-3 w-3" />
                        {perm.label}
                    </span>
                ))}
                {remainingCount > 0 && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-widest ring-1 ring-slate-600/10" title={`${remainingCount} more permissions`}>
                        +{remainingCount}
                    </span>
                )}
            </>
        );
    };

    if (view === 'editor') {
        const currentRole = actionId ? roles.find(r => r.id === actionId) : null;

        // If editing but role not found (and not loading), redirect or show error?
        // Ideally we might want to fetch the specific role if not in list, but for now we rely on list being loaded or list load.
        // Actually, RoleForm handles initialData. If we are in edit mode, pass initialData.

        return (
            <RoleForm
                title={actionId ? "Edit Role" : "Create New Role"}
                subtitle={actionId ? `Edit permissions for ${currentRole?.name || 'role'}` : "Define a new role and its permissions."}
                initialData={currentRole}
                onSave={handleSave}
            />
        );
    }

    return (
        <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
                isAlert={confirmModal.isAlert}
                onConfirm={confirmModal.onConfirm}
                confirmText="Delete Role"
            />

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
                        Roles & <span className="text-blue-600 font-bold">Permissions</span>
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 font-semibold tracking-tight">Define access levels and security policies.</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* View Toggle */}
                    <div className="flex items-center p-1 bg-slate-100/80 backdrop-blur-sm rounded-xl border border-slate-200">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={classNames(
                                "p-2 rounded-lg transition-all",
                                viewMode === 'grid' ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <Squares2X2Icon className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={classNames(
                                "p-2 rounded-lg transition-all",
                                viewMode === 'list' ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <QueueListIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <button
                        onClick={handleCreate}
                        className="inline-flex items-center gap-x-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 leading-none"
                    >
                        <PlusIcon className="h-4 w-4" strokeWidth={3} />
                        New Role
                    </button>
                </div>
            </div>

            {/* Content View */}
            {viewMode === 'grid' ? (
                /* Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
                    {isLoading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-64 rounded-[2.5rem] bg-slate-100 animate-pulse" />
                        ))
                    ) : (
                        roles.map((role) => {
                            const RoleIcon = iconMap[role.icon || 'ShieldCheckIcon'] || ShieldCheckIcon;
                            const isSystemRole = role.name === 'Super Admin' || role.name === 'Admin';

                            return (
                                <div key={role.id} className="group relative overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-sm border border-slate-200 hover:shadow-xl hover:shadow-slate-200 hover:-translate-y-1 transition-all duration-500">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className={classNames(
                                            "p-4 rounded-2xl border transition-all duration-500",
                                            isSystemRole ? "bg-blue-600 border-blue-700 text-white shadow-lg shadow-blue-500/20" : "bg-slate-50 border-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:border-blue-700 group-hover:text-white"
                                        )}>
                                            <RoleIcon className="h-6 w-6" />
                                        </div>
                                        <div className="flex items-center gap-2 relative z-10">
                                            <button
                                                onClick={() => handleEdit(role)}
                                                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                                            >
                                                <PencilSquareIcon className="h-4 w-4" />
                                            </button>
                                            {!isSystemRole && (
                                                <button
                                                    onClick={() => handleDelete(role.id)}
                                                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-bold text-slate-900 font-display">{role.name}</h3>
                                                {isSystemRole && (
                                                    <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-[8px] font-black text-blue-600 ring-1 ring-blue-600/10 uppercase tracking-tighter">System</span>
                                                )}
                                            </div>
                                            <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mt-1">
                                                <UsersIcon className="h-3 w-3" />
                                                {role.users?.length || 0} Members Assigned
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-2">
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {renderPermissionBadges(role)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Decorative background element */}
                                    <div className={classNames(
                                        "absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl transition-colors duration-700",
                                        isSystemRole ? "bg-blue-600/10" : "bg-blue-600/5 group-hover:bg-blue-600/10"
                                    )}></div>
                                </div>
                            );
                        })
                    )}
                </div>
            ) : (
                /* List View */
                <div className="mx-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="pl-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role Name</th>
                                    <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Members</th>
                                    <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Permissions</th>
                                    <th className="pr-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {roles.map((role) => {
                                    const RoleIcon = iconMap[role.icon || 'ShieldCheckIcon'] || ShieldCheckIcon;
                                    const isSystemRole = role.name === 'Super Admin' || role.name === 'Admin';

                                    return (
                                        <tr key={role.id} className="group hover:bg-slate-50/30 transition-colors">
                                            <td className="pl-8 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={classNames(
                                                        "p-2.5 rounded-xl border transition-colors",
                                                        isSystemRole ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-white border-slate-200 text-slate-400 group-hover:border-blue-200 group-hover:text-blue-500"
                                                    )}>
                                                        <RoleIcon className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-slate-900">{role.name}</span>
                                                            {isSystemRole && <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-[9px] font-black text-blue-600 uppercase tracking-tighter">System</span>}
                                                        </div>
                                                        <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline-block">
                                                            {isSystemRole ? "Core System Role" : "Custom Role"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <UsersIcon className="h-4 w-4 text-slate-400" />
                                                    <span className="text-xs font-bold">{role.users?.length || 0}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {renderPermissionBadges(role, 4)}
                                                </div>
                                            </td>
                                            <td className="pr-8 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(role)}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                        title="Edit Role"
                                                    >
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                    </button>
                                                    {!isSystemRole && (
                                                        <button
                                                            onClick={() => handleDelete(role.id)}
                                                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                            title="Delete Role"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )
            }
        </div>
    );
}

export default function RolesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        }>
            <RolesPageContent />
        </Suspense>
    );
}
