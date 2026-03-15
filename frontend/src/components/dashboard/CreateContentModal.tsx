import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
    XMarkIcon,
    DocumentPlusIcon,
    UserPlusIcon,
    PhotoIcon,
    ShieldCheckIcon,
    NewspaperIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePermissions } from '@/context/PermissionsContext';
import { checkPermission } from '@/lib/permissions';

interface CreateContentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateContentModal({ isOpen, onClose }: CreateContentModalProps) {
    const { permissions } = usePermissions();

    const options = [
        {
            title: 'New Blog Post',
            description: 'Write and publish a new blog article.',
            icon: NewspaperIcon,
            href: '/dashboard/blog?action=new', // Verifying route compatibility later
            permission: 'content_create',
            color: 'bg-emerald-50 text-emerald-600',
            hoverColor: 'group-hover:bg-emerald-600 group-hover:text-white'
        },
        {
            title: 'New Page',
            description: 'Create a static page for the website.',
            icon: DocumentPlusIcon,
            href: '/dashboard/pages?action=new',
            permission: 'content_create',
            color: 'bg-purple-50 text-purple-600',
            hoverColor: 'group-hover:bg-purple-600 group-hover:text-white'
        }
    ];

    const visibleOptions = options.filter(opt => checkPermission(permissions, opt.permission));

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto w-screen">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-[2rem] bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-slate-100">
                                <div className="absolute top-4 right-4 z-10">
                                    <button
                                        type="button"
                                        className="rounded-full p-2 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                                        onClick={onClose}
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="p-8">
                                    <div className="text-center mb-8">
                                        <h3 className="text-2xl font-bold text-slate-900 font-display">Create Content</h3>
                                        <p className="mt-2 text-sm text-slate-500 font-medium tracking-tight">Select what you would like to create today.</p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {visibleOptions.map((option) => (
                                            <Link
                                                key={option.title}
                                                href={option.href}
                                                onClick={onClose}
                                                className="group relative flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-600/5 transition-all duration-300"
                                            >
                                                <div className={`flex-shrink-0 p-3 rounded-xl ${option.color} ${option.hoverColor} transition-all duration-300 shadow-sm ring-1 ring-black/5`}>
                                                    <option.icon className="h-6 w-6" />
                                                </div>
                                                <div className="flex-1 min-w-0 pt-1">
                                                    <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                        {option.title}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500 leading-relaxed font-medium">
                                                        {option.description}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>

                                    {visibleOptions.length === 0 && (
                                        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                            <ShieldCheckIcon className="mx-auto h-12 w-12 text-slate-300" />
                                            <p className="mt-2 text-sm font-bold text-slate-900">Access Restricted</p>
                                            <p className="text-xs text-slate-500 mt-1">You don't have permission to create any content.</p>
                                        </div>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
