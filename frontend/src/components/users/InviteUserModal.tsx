import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import UnsavedChangesAlert from '@/components/ui/UnsavedChangesAlert';
import { apiRequest } from '@/lib/api';
import {
    XMarkIcon,
    EnvelopeIcon,
    ShieldCheckIcon,
    GlobeAltIcon,
    PlusIcon,
    TrashIcon
} from '@heroicons/react/24/outline';

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInvite: (data: any) => void;
}

export default function InviteUserModal({ isOpen, onClose, onInvite }: InviteUserModalProps) {
    const [email, setEmail] = useState('');
    const [roleId, setRoleId] = useState('');
    const [ips, setIps] = useState<string[]>([]);
    const [currentIp, setCurrentIp] = useState('');
    const [sendEmail, setSendEmail] = useState(true);
    const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);

    const [roles, setRoles] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const [mounted, setMounted] = React.useState(false);

    const isDirty = () => {
        const defaultRoleId = roles.length > 0 ? roles[0].id : '';
        return email.trim() !== '' || roleId !== defaultRoleId || ips.length > 0 || currentIp.trim() !== '' || !sendEmail;
    };

    const handleCloseAttempt = () => {
        if (isDirty()) {
            setShowUnsavedAlert(true);
        } else {
            onClose();
        }
    };

    const handleAddIp = () => {
        if (currentIp && !ips.includes(currentIp)) {
            setIps([...ips, currentIp]);
            setCurrentIp('');
        }
    };

    const removeIp = (ipToRemove: string) => {
        setIps(ips.filter(ip => ip !== ipToRemove));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onInvite({ email, role: roleId, ips, sendEmail });
    };

    useEffect(() => {
        setMounted(true);
        const fetchData = async () => {
            try {
                const [rolesData, userData] = await Promise.all([
                    apiRequest('/roles'),
                    apiRequest('/auth/profile'),
                ]);

                setCurrentUser(userData);

                const isSuperAdmin = userData?.role?.name === 'Super Admin' || userData?.role?.level === 0;
                const currentLevel = userData?.role?.level ?? 99;
                const filteredRoles = Array.isArray(rolesData) ? rolesData.filter((r: any) => {
                    if (isSuperAdmin) return r.name !== 'Super Admin'; // super admin assigns any non-super-admin role
                    if (r.level == null) return true;
                    return r.level > currentLevel; // others can only assign strictly lower privilege roles
                }) : [];

                setRoles(filteredRoles);
                if (filteredRoles.length > 0) {
                    setRoleId(filteredRoles[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch invitation data:', error);
            }
        };

        if (isOpen) {
            fetchData();
        } else {
            setEmail('');
            setIps([]);
            setCurrentIp('');
            setSendEmail(true);
            setShowUnsavedAlert(false);
        }
        return () => setMounted(false);
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    const modalContent = (
        <React.Fragment>
            <UnsavedChangesAlert
                isOpen={showUnsavedAlert}
                onSaveAndExit={() => {
                    onInvite({ email, role: roleId, ips, sendEmail });
                }}
                onDiscardAndExit={onClose}
                onCancel={() => setShowUnsavedAlert(false)}
                isSaving={false}
                confirmLabel="Send Invite"
            />

            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity animate-in fade-in duration-500"
                    onClick={handleCloseAttempt}
                />

                {/* Modal */}
                <div className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-white shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 border border-slate-100">
                    {/* Header Container */}
                    <div className="relative px-8 pt-8 pb-6">
                        <button
                            onClick={handleCloseAttempt}
                            className="absolute right-6 top-6 p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>

                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20">
                                <EnvelopeIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 tracking-tight font-display">Invite Team Member</h2>
                                <p className="text-xs font-semibold text-slate-500 tracking-tight">Onboard a new user with secure access levels.</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
                        {/* Role Selection */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Assign Role <span className="text-red-500">*</span></label>
                            {roles.length === 0 ? (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-semibold text-amber-700">
                                    No assignable roles available. Please create a role first before sending invitations.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-50 rounded-2xl border border-slate-100 max-h-48 overflow-y-auto">
                                    {roles.map((r) => (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => setRoleId(r.id)}
                                            className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${roleId === r.id
                                                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200'
                                                : 'text-slate-500 hover:text-slate-900'
                                                }`}
                                        >
                                            {r.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Email Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative group">
                                <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white focus:border-blue-600/20 transition-all"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        {/* IP Whitelisting */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">IP Whitelisting (Optional)</label>
                                <span className="text-[8px] font-black text-blue-600 uppercase tracking-tighter bg-blue-50 px-2 py-0.5 rounded-full ring-1 ring-blue-600/10">Enhanced Security</span>
                            </div>
                            <div className="relative flex gap-2">
                                <div className="relative flex-1 group">
                                    <GlobeAltIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                    <input
                                        type="text"
                                        value={currentIp}
                                        onChange={(e) => setCurrentIp(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddIp())}
                                        className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white focus:border-blue-600/20 transition-all"
                                        placeholder="e.g. 192.168.1.1"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddIp}
                                    className="px-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all"
                                >
                                    <PlusIcon className="h-5 w-5" strokeWidth={2.5} />
                                </button>
                            </div>
                            {/* Selected IPs */}
                            {ips.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3 animate-in fade-in slide-in-from-top-2">
                                    {ips.map(ip => (
                                        <span key={ip} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-[11px] font-bold text-blue-700 rounded-xl ring-1 ring-blue-600/10 group/ip">
                                            {ip}
                                            <button
                                                type="button"
                                                onClick={() => removeIp(ip)}
                                                className="text-blue-400 hover:text-blue-700 transition-colors"
                                            >
                                                <XMarkIcon className="h-3 w-3" strokeWidth={3} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Toggle: Send Email */}
                        <div className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 group cursor-pointer hover:bg-emerald-50 transition-all" onClick={() => setSendEmail(!sendEmail)}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg transition-all ${sendEmail ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                    <EnvelopeIcon className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-900 leading-none">Instant Notification</p>
                                    <p className="text-[9px] font-semibold text-slate-500 mt-1 uppercase tracking-tighter">Send invitation via email immediately</p>
                                </div>
                            </div>
                            <div className={`w-10 h-6 rounded-full transition-all relative ${sendEmail ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${sendEmail ? 'left-5' : 'left-1'}`} />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!roleId || !email.trim()}
                            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 hover:bg-blue-600 hover:shadow-blue-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-slate-900"
                        >
                            <span className="flex items-center justify-center gap-2">
                                Send Invite
                                <ShieldCheckIcon className="h-4 w-4 text-blue-400" />
                            </span>
                        </button>
                    </form>
                </div>
            </div>
        </React.Fragment>
    );

    return createPortal(modalContent, document.body);
}
