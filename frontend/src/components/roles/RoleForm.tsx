import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Changed from Link import
import { useForm } from '@/context/FormContext'; import {
    Cog6ToothIcon,
    BriefcaseIcon,
    AcademicCapIcon,
    BeakerIcon,
    GlobeAmericasIcon,
    BoltIcon,
    ChatBubbleBottomCenterTextIcon,
    RocketLaunchIcon,
    CommandLineIcon,
    ShieldCheckIcon,
    XMarkIcon,
    DocumentTextIcon,
    PhotoIcon,
    UsersIcon,
    PaintBrushIcon,
    PencilSquareIcon,
    IdentificationIcon,
    PresentationChartLineIcon,
    KeyIcon,
    ArchiveBoxIcon,
    UserGroupIcon,
    MagnifyingGlassIcon,
    MusicalNoteIcon,
    FilmIcon,
    ComputerDesktopIcon,
    SpeakerWaveIcon,
    QueueListIcon,
    BuildingOfficeIcon,
    CreditCardIcon,
    ArrowLeftIcon,
    CheckIcon,
    PlusIcon,
    TrashIcon,
    LockClosedIcon
} from '@heroicons/react/24/outline';
import IconPicker from '@/components/ui/IconPicker';

interface RoleFormProps {
    initialData?: any;
    onSave: (data: any) => Promise<void>;
    isLoading?: boolean;
    title: string;
    subtitle?: string;
}

export default function RoleForm({ initialData, onSave, isLoading: externalLoading, title, subtitle }: RoleFormProps) {
    const router = useRouter();
    const { setIsDirty } = useForm();
    const [name, setName] = useState('');
    const [level, setLevel] = useState(10);
    const [permissions, setPermissions] = useState({
        users_view: false,
        users_create: false,
        users_edit: false,
        users_delete: false,
        users_deactivate: false,
        users_reactivate: false,
        roles_view: false,
        roles_create: false,
        roles_edit: false,
        roles_delete: false,
        content_view: false,
        content_create: false,
        content_edit: false,
        content_delete: false,
        media_view: false,
        media_upload: false,
        media_delete: false,
        settings_edit: false,
        audit_view: false,
        themes_manage: false,
        menus_manage: false,
        analytics_view: false,
        seo_manage: false,
        leads_view: false,
        leads_manage: false,
        all: false,
    });
    const [icon, setIcon] = useState('ShieldCheckIcon');
    const [isSaving, setIsSaving] = useState(false);

    // Capture initial state for comparison
    const [initialState, setInitialState] = useState<{ name: string, icon: string, level: number, permissions: any }>({
        name: '',
        icon: 'ShieldCheckIcon',
        level: 10,
        permissions: {
            users_view: false,
            users_create: false,
            users_edit: false,
            users_delete: false,
            users_deactivate: false,
            users_reactivate: false,
            roles_view: false,
            roles_create: false,
            roles_edit: false,
            roles_delete: false,
            content_view: false,
            content_create: false,
            content_edit: false,
            content_delete: false,
            media_view: false,
            media_upload: false,
            media_delete: false,
            settings_edit: false,
            audit_view: false,
            analytics_view: false,
            seo_manage: false,
            all: false,
        }
    });

    useEffect(() => {
        if (initialData) {
            const loadedName = initialData.name || '';
            const loadedIcon = initialData.icon || 'ShieldCheckIcon';
            const loadedLevel = initialData.level ?? 10;
            let loadedPermissions;

            if (initialData.name === 'Super Admin') {
                loadedPermissions = Object.keys(permissions).reduce((acc, key) => ({ ...acc, [key]: true }), {});
            } else {
                loadedPermissions = {
                    users_view: initialData.permissions?.users_view || initialData.permissions?.manage_users || false,
                    users_create: initialData.permissions?.users_create || initialData.permissions?.manage_users || false,
                    users_edit: initialData.permissions?.users_edit || initialData.permissions?.manage_users || false,
                    users_delete: initialData.permissions?.users_delete || initialData.permissions?.manage_users || false,
                    users_deactivate: initialData.permissions?.users_deactivate || initialData.permissions?.manage_users || false,
                    users_reactivate: initialData.permissions?.users_reactivate || initialData.permissions?.manage_users || false,
                    roles_view: initialData.permissions?.roles_view || initialData.permissions?.manage_users || false,
                    roles_create: initialData.permissions?.roles_create || initialData.permissions?.manage_users || false,
                    roles_edit: initialData.permissions?.roles_edit || initialData.permissions?.manage_users || false,
                    roles_delete: initialData.permissions?.roles_delete || initialData.permissions?.manage_users || false,
                    content_view: initialData.permissions?.content_view || initialData.permissions?.manage_content || false,
                    content_create: initialData.permissions?.content_create || initialData.permissions?.manage_content || false,
                    content_edit: initialData.permissions?.content_edit || initialData.permissions?.manage_content || false,
                    content_delete: initialData.permissions?.content_delete || initialData.permissions?.manage_content || false,
                    media_view: initialData.permissions?.media_view || initialData.permissions?.manage_media || false,
                    media_upload: initialData.permissions?.media_upload || initialData.permissions?.manage_media || false,
                    media_delete: initialData.permissions?.media_delete || initialData.permissions?.manage_media || false,
                    settings_edit: initialData.permissions?.settings_edit || initialData.permissions?.manage_settings || false,
                    audit_view: initialData.permissions?.audit_view || initialData.permissions?.manage_settings || false,
                    themes_manage: initialData.permissions?.themes_manage || initialData.permissions?.manage_settings || false,
                    menus_manage: initialData.permissions?.menus_manage || initialData.permissions?.manage_settings || false,
                    analytics_view: initialData.permissions?.analytics_view || initialData.permissions?.manage_settings || false,
                    seo_manage: initialData.permissions?.seo_manage || initialData.permissions?.manage_settings || false,
                    leads_view: initialData.permissions?.leads_view || initialData.permissions?.manage_marketing || false,
                    leads_manage: initialData.permissions?.leads_manage || initialData.permissions?.manage_marketing || false,
                    all: initialData.permissions?.all || false,
                };
            }

            setName(loadedName);
            setIcon(loadedIcon);
            setLevel(loadedLevel);
            setPermissions(loadedPermissions as any);
            setInitialState({ name: loadedName, icon: loadedIcon, level: loadedLevel, permissions: loadedPermissions });
        }
    }, [initialData]);

    const checkDirty = () => {
        const currentPermissions = JSON.stringify(permissions);
        const initialPermissions = JSON.stringify(initialState.permissions);
        return name !== initialState.name || icon !== initialState.icon || level !== initialState.level || currentPermissions !== initialPermissions;
    };

    // Sync dirty state with global context
    useEffect(() => {
        setIsDirty(checkDirty());
    }, [name, icon, level, permissions, initialState, setIsDirty]);


    const handleCancelClick = () => {
        if (checkDirty()) {
            if (confirm('You have unsaved changes. Are you sure you want to discard them?')) {
                setIsDirty(false);
                router.push('/dashboard/roles');
            }
        } else {
            router.push('/dashboard/roles');
        }
    };

    const saveChanges = async () => {
        setIsSaving(true);
        try {
            await onSave({ name, icon, level, ...permissions });
            // onSave success should redirect, so we reset dirty here just in case
            setIsDirty(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await saveChanges();
    };

    const togglePermission = (key: keyof typeof permissions) => {
        // Prevent toggling permissions for Super Admin
        if (name === 'Super Admin' || initialData?.name === 'Super Admin') {
            return;
        }
        setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleAllPermissions = () => {
        if (name === 'Super Admin' || initialData?.name === 'Super Admin') return;

        const allKeys = Object.keys(permissions).filter(k => k !== 'all');
        const areAllSelected = allKeys.every(k => permissions[k as keyof typeof permissions]);

        const newPermissions = allKeys.reduce((acc, key) => ({
            ...acc,
            [key]: !areAllSelected
        }), {} as typeof permissions);

        setPermissions(prev => ({ ...prev, ...newPermissions }));
    };

    // ... (inside the render, near the header of permissions)


    const toggleSectionPermissions = (sectionKeys: string[]) => {
        if (name === 'Super Admin' || initialData?.name === 'Super Admin') return;

        const areAllSectionSelected = sectionKeys.every(k => permissions[k as keyof typeof permissions]);

        const newSectionPerms = sectionKeys.reduce((acc, key) => ({
            ...acc,
            [key]: !areAllSectionSelected
        }), {});

        setPermissions(prev => ({ ...prev, ...newSectionPerms }));
    };

    // ... (inside the render, near the header of permissions)


    const permissionSections = [
        {
            title: 'User Management',
            desc: 'Control who can access the CMS and what they can do.',
            permissions: [
                { key: 'users_view', label: 'View Users', icon: UsersIcon, desc: 'View the list of users and their profiles.' },
                { key: 'users_create', label: 'Invite Users', icon: PlusIcon, desc: 'Invite new team members.' },
                { key: 'users_edit', label: 'Edit Users', icon: PencilSquareIcon, desc: 'Modify user details and roles (subject to hierarchy).' },
                { key: 'users_delete', label: 'Delete Users', icon: TrashIcon, desc: 'Permenantly remove users.' },
                { key: 'users_deactivate', label: 'Deactivate Users', icon: XMarkIcon, desc: 'Temporarily block access.' },
                { key: 'users_reactivate', label: 'Reactivate Users', icon: CheckIcon, desc: 'Restore access or transfer accounts.' },
            ]
        },
        {
            title: 'Role Management',
            desc: 'Define and manage security levels.',
            permissions: [
                { key: 'roles_view', label: 'View Roles', icon: ShieldCheckIcon, desc: 'View existing roles and permissions.' },
                { key: 'roles_create', label: 'Create Roles', icon: PlusIcon, desc: 'Create new custom roles.' },
                { key: 'roles_edit', label: 'Edit Roles', icon: PencilSquareIcon, desc: 'Modify role settings and levels.' },
                { key: 'roles_delete', label: 'Delete Roles', icon: TrashIcon, desc: 'Remove unused roles.' },
            ]
        },
        {
            title: 'Content & Media',
            desc: 'Manage the core website data.',
            permissions: [
                { key: 'content_view', label: 'View Content', icon: DocumentTextIcon, desc: 'Access blogs and content modules.' },
                { key: 'content_create', label: 'Create Content', icon: PlusIcon, desc: 'Write new blog posts and content.' },
                { key: 'content_edit', label: 'Edit Content', icon: PencilSquareIcon, desc: 'Modify existing content.' },
                { key: 'content_delete', label: 'Delete Content', icon: TrashIcon, desc: 'Remove blogs and content entries.' },
                { key: 'media_view', label: 'View Media', icon: PhotoIcon, desc: 'Access the media library.' },
                { key: 'media_upload', label: 'Upload Media', icon: RocketLaunchIcon, desc: 'Add new files to the system.' },
                { key: 'media_delete', label: 'Delete Media', icon: TrashIcon, desc: 'Remove files from storage.' },
            ]
        },
        {
            title: 'System & Configuration',
            desc: 'Administrative tools for site management.',
            permissions: [
                { key: 'settings_edit', label: 'Edit Settings', icon: Cog6ToothIcon, desc: 'Modify global site and server settings.' },
                { key: 'audit_view', label: 'View Audit Logs', icon: CommandLineIcon, desc: 'Track all administrative actions.' },
                { key: 'themes_manage', label: 'Manage Themes', icon: PaintBrushIcon, desc: 'Install and activate website themes.' },
                { key: 'menus_manage', label: 'Manage Menus', icon: QueueListIcon, desc: 'Configure navigation menus.' },
            ]
        },
        {
            title: 'Marketing & SEO',
            desc: 'Tools for growth and visibility.',
            permissions: [
                { key: 'analytics_view', label: 'View Analytics', icon: PresentationChartLineIcon, desc: 'Monitor site performance.' },
                { key: 'seo_manage', label: 'Manage SEO', icon: MagnifyingGlassIcon, desc: 'Configure meta tags, redirects, and robots.txt.' },
                { key: 'leads_view', label: 'View Leads', icon: UserGroupIcon, desc: 'Access form submissions and leads.' },
                { key: 'leads_manage', label: 'Manage Leads', icon: BriefcaseIcon, desc: 'Export and delete lead data.' },
            ]
        }
    ];

    const icons = [
        { name: 'ShieldCheckIcon', icon: ShieldCheckIcon, label: 'Admin/Security' },
        { name: 'PencilSquareIcon', icon: PencilSquareIcon, label: 'Editor/Writer' },
        { name: 'PaintBrushIcon', icon: PaintBrushIcon, label: 'Designer/UI' },
        { name: 'UsersIcon', icon: UsersIcon, label: 'HR/People' },
        { name: 'UserGroupIcon', icon: UserGroupIcon, label: 'Community/Support' },
        { name: 'PresentationChartLineIcon', icon: PresentationChartLineIcon, label: 'Marketing/Growth' },
        { name: 'MagnifyingGlassIcon', icon: MagnifyingGlassIcon, label: 'SEO/Analyst' },
        { name: 'CommandLineIcon', icon: CommandLineIcon, label: 'Developer/IT' },
        { name: 'ComputerDesktopIcon', icon: ComputerDesktopIcon, label: 'System Admin' },
        { name: 'SpeakerWaveIcon', icon: SpeakerWaveIcon, label: 'Comms/PR' },
        { name: 'QueueListIcon', icon: QueueListIcon, label: 'DevOps/Ops' },
        { name: 'BuildingOfficeIcon', icon: BuildingOfficeIcon, label: 'Corporate' },
        { name: 'CreditCardIcon', icon: CreditCardIcon, label: 'Finance/Billing' },
        { name: 'DocumentTextIcon', icon: DocumentTextIcon, label: 'Content Creator' },
        { name: 'PhotoIcon', icon: PhotoIcon, label: 'Media Manager' },
        { name: 'FilmIcon', icon: FilmIcon, label: 'Video Editor' },
        { name: 'MusicalNoteIcon', icon: MusicalNoteIcon, label: 'Audio Engineer' },
        { name: 'BriefcaseIcon', icon: BriefcaseIcon, label: 'Business' },
        { name: 'AcademicCapIcon', icon: AcademicCapIcon, label: 'Legal/Compliance' },
        { name: 'RocketLaunchIcon', icon: RocketLaunchIcon, label: 'Owner/Founder' },
    ];

    const CurrentIcon = icons.find(i => i.name === icon)?.icon || ShieldCheckIcon;
    const isLoading = externalLoading || isSaving;

    return (
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto pb-20">

            {/* Header / Nav */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={handleCancelClick}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 font-display tracking-tight">{title}</h1>
                        {subtitle && <p className="text-sm font-medium text-slate-500">{subtitle}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleCancelClick}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 px-8 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-lg shadow-slate-900/20 hover:bg-blue-600 hover:shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <CheckIcon className="h-5 w-5" strokeWidth={3} />
                        )}
                        <span>Save Role</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Basic Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/50">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Role Details</h3>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Role Name</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={initialData?.name === 'Super Admin' || initialData?.name === 'Admin'}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white focus:border-blue-600 transition-all"
                                    placeholder="e.g. Content Moderator"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-slate-700">Hierarchy Level</label>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${level === 0 ? 'bg-amber-100 text-amber-700' :
                                        level === 1 ? 'bg-blue-100 text-blue-700' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                        {level === 0 ? 'Level 0 (God Mode)' :
                                            level === 1 ? 'Level 1 (Admin)' :
                                                `Level ${level}`}
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={level}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (!isNaN(val) && val >= 0 && val <= 100) setLevel(val);
                                            }}
                                            disabled={initialData?.name === 'Super Admin' || initialData?.name === 'Admin'}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white focus:border-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <span className="text-xs font-bold text-slate-400">0-100</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter px-1">
                                        <span>Highest Authority (0)</span>
                                        <span>Lowest Authority (100)</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-relaxed italic bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                                        Users can only manage others with a **strictly higher** level number than their own.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <IconPicker
                                    value={icon}
                                    onChange={setIcon}
                                    label="Role Icon"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Permissions */}
                <div className="lg:col-span-2 space-y-8">
                    {permissionSections.map((section, sIdx) => {
                        const sectionKeys = section.permissions.map(p => p.key);
                        const isAllSelected = sectionKeys.every(k => permissions[k as keyof typeof permissions]);

                        return (
                            <div key={sIdx} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/50">
                                <div className="mb-8">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 font-display">{section.title}</h3>
                                            <p className="text-sm text-slate-500">{section.desc}</p>
                                        </div>
                                        {!(name === 'Super Admin' || initialData?.name === 'Super Admin') && (
                                            <button
                                                type="button"
                                                onClick={() => toggleSectionPermissions(sectionKeys)}
                                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors uppercase tracking-wider ${isAllSelected
                                                    ? 'text-slate-500 bg-slate-100 hover:bg-slate-200'
                                                    : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                                                    }`}
                                            >
                                                {isAllSelected ? 'Deselect All' : 'Select All'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {section.permissions.map((perm) => {
                                        const isSuperAdmin = name === 'Super Admin' || initialData?.name === 'Super Admin';
                                        const isEnabled = permissions[perm.key as keyof typeof permissions];

                                        return (
                                            <div
                                                key={perm.key}
                                                onClick={() => !isSuperAdmin && togglePermission(perm.key as any)}
                                                className={`relative group flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 ${isSuperAdmin
                                                    ? 'bg-blue-50/50 border-blue-200 shadow-sm cursor-not-allowed'
                                                    : isEnabled
                                                        ? 'bg-blue-50/50 border-blue-200 shadow-sm cursor-pointer'
                                                        : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200 cursor-pointer'
                                                    }`}
                                            >
                                                {isSuperAdmin && (
                                                    <div className="absolute top-2 right-2">
                                                        <LockClosedIcon className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                )}

                                                <div className={`mt-1 p-2 rounded-xl transition-colors ${isEnabled
                                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                                    : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-slate-600 group-hover:shadow-md'
                                                    }`}>
                                                    <perm.icon className="h-5 w-5" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h4 className={`text-sm font-bold ${isEnabled ? 'text-blue-900' : 'text-slate-900'}`}>
                                                            {perm.label}
                                                        </h4>
                                                        <div className={`relative flex-shrink-0 h-5 w-9 border-2 border-transparent rounded-full transition-colors ease-in-out duration-200 focus:outline-none ${isEnabled ? 'bg-blue-600' : 'bg-slate-200'
                                                            } ${isSuperAdmin ? 'opacity-70' : 'cursor-pointer'}`}>
                                                            <span className={`pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${isEnabled ? 'translate-x-[18px]' : 'translate-x-0.5'
                                                                }`} />
                                                        </div>
                                                    </div>
                                                    <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                                                        {perm.desc}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </form>
    );
}
