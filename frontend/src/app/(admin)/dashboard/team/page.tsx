'use client';

import { useState, useEffect, Suspense } from 'react';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    ArrowLeftIcon,
    CloudArrowUpIcon,
    PhotoIcon,
    UserGroupIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import MediaPickerModal from '@/components/ui/MediaPickerModal';
import UnsavedChangesAlert from '@/components/ui/UnsavedChangesAlert';
import AlertDialog from '@/components/ui/AlertDialog';
import { useNotification } from '@/context/NotificationContext';
import { useForm } from '@/context/FormContext';
import { apiRequest } from '@/lib/api';
import ThemeCompatibilityBanner, { useThemeCompatibility } from '@/components/ui/ThemeCompatibilityBanner';


function TeamPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { showToast } = useNotification();
    const { settings } = useSettings();
    const { isDirty, setIsDirty } = useForm();
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [contentTheme, setContentTheme] = useState<string | null>(null);
    const { isSupported } = useThemeCompatibility('team');

    // View derived from URL
    const action = searchParams.get('action');
    const actionId = searchParams.get('id');
    const view = action === 'new' || (action === 'edit' && actionId) ? 'editor' : 'list';

    const [team, setTeam] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [canManageContent, setCanManageContent] = useState(false);

    const defaultFormData = {
        name: '',
        role: '',
        bio: '',
        image: '',
        socialLinks: { linkedin: '', twitter: '', instagram: '' },
        order: 0
    };

    const [formData, setFormData] = useState<any>(defaultFormData);
    const [initialState, setInitialState] = useState<any>(defaultFormData);
    const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
    const [isMediaOpen, setIsMediaOpen] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    // Effect to handle URL-based data loading for Edit mode
    useEffect(() => {
        if (view === 'editor' && action === 'edit' && actionId) {
            // Find member in existing list or fetch if needed
            const member = team.find(t => t.id === actionId);
            if (member) {
                populateForm(member);
            } else if (!isLoading && team.length > 0) {
                // If loaded but not found in list (maybe pagination later?), fetch individual
                fetchMember(actionId);
            }
        } else if (view === 'editor' && action === 'new') {
            // Reset for new
            if (currentMemberId !== null) {
                resetForm();
            }
        }
    }, [view, action, actionId, team, isLoading]);

    // Sync isDirty with FormContext
    useEffect(() => {
        const dirty = JSON.stringify(formData) !== JSON.stringify(initialState);
        setIsDirty(dirty);
    }, [formData, initialState, setIsDirty]);

    const fetchInitialData = async () => {
        try {
            const [teamData, profile] = await Promise.all([
                apiRequest('/team'),
                apiRequest('/auth/profile')
            ]);

            setTeam(Array.isArray(teamData) ? teamData : []);

            if (profile.role?.permissions?.manage_content || profile.role?.name === 'Super Admin' || profile.role?.name === 'Admin') {
                setCanManageContent(true);
            }
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMember = async (id: string) => {
        try {
            const member = await apiRequest(`/team/${id}`);
            if (member) populateForm(member);
        } catch (error) {
            showToast('Failed to load team member', 'error');
            router.push('/dashboard/team');
        }
    };

    const populateForm = (member: any) => {
        const activeTheme = settings['active_theme'];
        const memberTheme = member.theme;

        if (memberTheme && activeTheme && memberTheme !== activeTheme) {
            setIsReadOnly(true);
            setContentTheme(memberTheme);
        } else {
            setIsReadOnly(false);
            setContentTheme(null);
        }

        const data = {
            name: member.name,
            role: member.role,
            bio: member.bio || '',
            image: member.image || '',
            socialLinks: member.socialLinks || { linkedin: '', twitter: '', instagram: '' },
            order: member.order
        };
        setFormData(data);
        setInitialState(data);
        setCurrentMemberId(member.id);
    };

    const resetForm = () => {
        setIsReadOnly(false);
        setContentTheme(null);
        const data = { ...defaultFormData, order: team.length };
        setFormData(data);
        setInitialState(data);
        setCurrentMemberId(null);
    };

    const handleCreate = () => {
        resetForm();
        router.push('/dashboard/team?action=new');
    };

    const handleEdit = (member: any) => {
        // Optimistically populate to avoid flicker before URL effect kicks in
        populateForm(member);
        router.push(`/dashboard/team?action=edit&id=${member.id}`);
    };

    const handleBackClick = () => {
        if (isDirty) {
            setShowUnsavedAlert(true);
        } else {
            router.push('/dashboard/team');
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const url = currentMemberId ? `/team/${currentMemberId}` : '/team';
        const method = currentMemberId ? 'PATCH' : 'POST';

        try {
            await apiRequest(url, {
                method,
                body: formData
            });

            showToast('Team member saved successfully!', 'success');
            setIsDirty(false); // Clear dirty state immediately
            fetchInitialData();
            // Update initial state to match saved to prevent dirty check on redirect
            setInitialState(formData);
            router.push('/dashboard/team');
        } catch (error) {
            console.error(error);
            // apiRequest handles toast for errors usually, but if not:
            // showToast('Failed to save team member.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; memberId: string | null }>({
        isOpen: false,
        memberId: null
    });

    const handleDeleteClick = (id: string) => {
        setDeleteConfirmation({ isOpen: true, memberId: id });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation.memberId) return;

        try {
            await apiRequest(`/team/${deleteConfirmation.memberId}`, { method: 'DELETE' });
            showToast('Team member deleted successfully!', 'success');
            fetchInitialData();
            setDeleteConfirmation({ isOpen: false, memberId: null });
        } catch (error) {
            console.error(error);
            showToast('Failed to delete team member', 'error');
            setDeleteConfirmation({ isOpen: false, memberId: null });
        }
    };

    const cancelDelete = () => {
        setDeleteConfirmation({ isOpen: false, memberId: null });
    };

    if (view === 'editor') {
        return (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <UnsavedChangesAlert
                    isOpen={showUnsavedAlert}
                    onSaveAndExit={async () => {
                        await handleSave();
                        // handleSave handles redirect
                    }}
                    onDiscardAndExit={() => {
                        setIsDirty(false);
                        router.push('/dashboard/team');
                    }}
                    onCancel={() => setShowUnsavedAlert(false)}
                    isSaving={isSaving}
                    variant="success"
                />

                {isReadOnly && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="bg-amber-100 p-2 rounded-xl">
                            <ExclamationCircleIcon className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-amber-900">Incompatible Theme Content</h3>
                            <p className="text-xs font-semibold text-amber-700 mt-0.5">
                                This team member was added for the <span className="underline decoration-2 underline-offset-2 capitalize">{contentTheme || 'another'}</span> theme. 
                                You can view their details, but to make changes, please switch the active theme in Settings.
                            </p>
                        </div>
                    </div>
                )}

                <ThemeCompatibilityBanner moduleName="team" />

                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/50 shadow-sm sticky top-4 z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={handleBackClick} className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors">
                            <ArrowLeftIcon className="h-5 w-5" />
                        </button>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentMemberId ? 'Editing Team Member' : 'New Team Member'}</p>
                            <h1 className="text-xl font-bold text-slate-900 font-display">{formData.name || 'Untitled Member'}</h1>
                        </div>
                    </div>
                     <button 
                        onClick={() => handleSave()} 
                        disabled={isSaving || isReadOnly || !isSupported}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <CloudArrowUpIcon className="h-4 w-4" />
                        {!isSupported ? 'Unsupported by Theme' : isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl p-10 border border-slate-200/60 shadow-xl space-y-6">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Full Name</label>
                                 <input
                                    type="text"
                                    placeholder="Enter team member name..."
                                    value={formData.name}
                                    disabled={isReadOnly}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full text-3xl font-bold text-slate-900 placeholder:text-slate-200 border-none focus:ring-0 p-0 font-display bg-transparent mt-2 disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Role / Position</label>
                                 <input
                                    type="text"
                                    value={formData.role}
                                    disabled={isReadOnly}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10 mt-2 disabled:opacity-50"
                                    placeholder="e.g., Principal Architect, Senior Designer"
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Biography</h3>
                             <textarea
                                value={formData.bio}
                                disabled={isReadOnly}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                rows={6}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/10 resize-none disabled:opacity-50"
                                placeholder="Brief professional background and expertise..."
                            />
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Social Links</h3>
                            <div className="space-y-3">
                                 <input
                                    type="text"
                                    value={formData.socialLinks.linkedin}
                                    disabled={isReadOnly}
                                    onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, linkedin: e.target.value } })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10 disabled:opacity-50"
                                    placeholder="LinkedIn URL"
                                />
                                <input
                                    type="text"
                                    value={formData.socialLinks.twitter}
                                    disabled={isReadOnly}
                                    onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, twitter: e.target.value } })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10 disabled:opacity-50"
                                    placeholder="Twitter URL"
                                />
                                <input
                                    type="text"
                                    value={formData.socialLinks.instagram}
                                    disabled={isReadOnly}
                                    onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, instagram: e.target.value } })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10 disabled:opacity-50"
                                    placeholder="Instagram URL"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Profile Photo</h3>
                                 {formData.image && !isReadOnly && (
                                    <button onClick={() => setFormData({ ...formData, image: '' })} className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:text-red-600 transition-colors">Remove</button>
                                )}
                            </div>
                             <div
                                onClick={() => {
                                    if (isReadOnly) return;
                                    setIsMediaOpen(true);
                                }}
                                className={`aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 ${!isReadOnly ? 'hover:bg-slate-100/50 hover:border-blue-400 hover:text-blue-500 cursor-pointer' : 'cursor-not-allowed'} transition-all group overflow-hidden relative`}
                            >
                                {formData.image ? (
                                    <img src={formData.image} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <>
                                        <PhotoIcon className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-bold">Select from Library</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <MediaPickerModal
                            isOpen={isMediaOpen}
                            onClose={() => setIsMediaOpen(false)}
                            onSelect={(url) => {
                                setFormData({ ...formData, image: url });
                                setIsMediaOpen(false);
                            }}
                        />

                        <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Display Order</h3>
                             <input
                                type="number"
                                value={formData.order}
                                disabled={isReadOnly}
                                onChange={(e) => setFormData({ ...formData, order: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10 disabled:opacity-50"
                            />
                            <p className="text-[10px] text-slate-400">Lower numbers appear first</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
                        Team <span className="text-blue-600 font-bold">Management</span>
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 font-semibold tracking-tight">Manage your team members and their profiles.</p>
                </div>
                 <div className="flex items-center gap-3">
                    {canManageContent && (
                        <button 
                            onClick={handleCreate} 
                            disabled={!isSupported}
                            className="inline-flex items-center gap-x-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95 leading-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <PlusIcon className="h-4 w-4" strokeWidth={3} />
                            Add Member
                        </button>
                    )}
                </div>
            </div>

            <ThemeCompatibilityBanner moduleName="team" />

            <div className="mx-2 bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/30">
                                <th className="pl-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Member</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order</th>
                                <th className="pr-8 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={4} className="px-8 py-8"><div className="h-12 bg-slate-50 rounded-2xl" /></td>
                                    </tr>
                                ))
                            ) : team.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <UserGroupIcon className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-sm font-bold text-slate-500">No team members found. Add your first one!</p>
                                    </td>
                                </tr>
                            ) : (
                                team.map((member) => (
                                    <tr key={member.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="pl-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                                                    {member.image ? (
                                                        <img src={member.image} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-slate-300">
                                                            <UserGroupIcon className="h-6 w-6" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{member.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-5 font-bold text-slate-700 text-xs">{member.role}</td>
                                        <td className="px-4 py-5 text-xs font-semibold text-slate-500">{member.order}</td>
                                        <td className="pr-8 py-5 text-right">
                                            {canManageContent && (
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(member)} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all">
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteClick(member.id)} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-all">
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AlertDialog
                isOpen={deleteConfirmation.isOpen}
                title="Delete Team Member"
                description="Are you sure you want to delete this team member? This action cannot be undone."
                confirmLabel="Delete Member"
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        </div>
    );
}

export default function TeamPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        }>
            <TeamPageContent />
        </Suspense>
    );
}
