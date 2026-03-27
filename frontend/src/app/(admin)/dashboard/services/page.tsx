'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    ArrowLeftIcon,
    CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { useForm } from '@/context/FormContext';
import UnsavedChangesAlert from '@/components/ui/UnsavedChangesAlert';
import AlertDialog from '@/components/ui/AlertDialog';
import ThemeCompatibilityBanner, { useThemeCompatibility } from '@/components/ui/ThemeCompatibilityBanner';

// Theme-specific icon map — must match Services.tsx ICON_MAP in the theme
const SERVICE_ICONS: { name: string; label: string; svg: React.ReactNode }[] = [
    { name: 'map-pin', label: 'Map Pin', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
    { name: 'file-text', label: 'File / Docs', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
    { name: 'eye', label: 'Eye / View', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
    { name: 'trending-up', label: 'Trending Up', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
    { name: 'home', label: 'Home', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { name: 'headphones', label: 'Support', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg> },
    { name: 'compass', label: 'Compass', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg> },
    { name: 'globe', label: 'Globe', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
    { name: 'building', label: 'Building', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 22V12h6v10"/><line x1="9" y1="7" x2="9.01" y2="7"/><line x1="12" y1="7" x2="12.01" y2="7"/><line x1="15" y1="7" x2="15.01" y2="7"/><line x1="9" y1="11" x2="9.01" y2="11"/><line x1="12" y1="11" x2="12.01" y2="11"/><line x1="15" y1="11" x2="15.01" y2="11"/></svg> },
    { name: 'dollar', label: 'Dollar', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    { name: 'credit-card', label: 'Credit Card', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
    { name: 'bar-chart', label: 'Bar Chart', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    { name: 'pie-chart', label: 'Pie Chart', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg> },
    { name: 'users', label: 'Team', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { name: 'user-check', label: 'Verified User', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg> },
    { name: 'phone', label: 'Phone', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 14a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 3.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 10.91a16 16 0 0 0 5 5l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> },
    { name: 'mail', label: 'Email', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
    { name: 'message-circle', label: 'Message', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { name: 'search', label: 'Search', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
    { name: 'shield', label: 'Shield', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
    { name: 'check-circle', label: 'Check Circle', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
    { name: 'star', label: 'Star', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
    { name: 'award', label: 'Award', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg> },
    { name: 'key', label: 'Key', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg> },
    { name: 'lock', label: 'Lock', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
    { name: 'heart', label: 'Heart', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
    { name: 'clock', label: 'Clock', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { name: 'calendar', label: 'Calendar', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
    { name: 'briefcase', label: 'Briefcase', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> },
    { name: 'clipboard', label: 'Clipboard', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg> },
    { name: 'layers', label: 'Layers', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> },
    { name: 'image', label: 'Image', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
    { name: 'camera', label: 'Camera', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg> },
    { name: 'flag', label: 'Flag', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> },
    { name: 'zap', label: 'Lightning', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
    { name: 'sun', label: 'Sun / Outdoor', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> },
    { name: 'leaf', label: 'Leaf / Eco', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M17 8C8 10 5.9 16.17 3.82 19.08a2 2 0 1 0 3.16 2.44C9 18.74 13.63 17 17 8z"/><path d="M17 8a1 1 0 0 0-1-1"/></svg> },
    { name: 'percent', label: 'Percent', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg> },
    { name: 'gift', label: 'Gift / Offer', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg> },
    { name: 'tag', label: 'Tag / Price', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> },
    { name: 'bookmark', label: 'Bookmark', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> },
    { name: 'activity', label: 'Activity', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
    { name: 'navigation', label: 'Navigation', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg> },
    { name: 'tool', label: 'Tool', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
    { name: 'settings', label: 'Settings', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
    { name: 'filter', label: 'Filter', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg> },
    { name: 'grid', label: 'Grid / Listing', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
    { name: 'list', label: 'List', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
    { name: 'truck', label: 'Moving / Transport', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
    { name: 'mountain', label: 'Mountain / View', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><polygon points="3 20 9 8 14 14 17 11 21 20 3 20"/><circle cx="18" cy="7" r="2"/></svg> },
    { name: 'umbrella', label: 'Coverage', svg: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M23 12a11.05 11.05 0 0 0-22 0zm-5 7a3 3 0 0 1-6 0v-7"/></svg> },
];

interface Service {
    id: string;
    title: string;
    description: string;
    icon: string;
    order: number;
    updatedAt: string;
}

function ServicesPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { setIsDirty, registerSaveHandler } = useForm();
    const { showToast } = useNotification();
    const { isSupported } = useThemeCompatibility('services');

    // Derived state
    const view = searchParams.get('action') === 'new' || searchParams.get('action') === 'edit' ? 'editor' : 'list';
    const actionId = searchParams.get('id');

    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showExitAlert, setShowExitAlert] = useState(false);

    const defaultFormData = {
        title: '',
        description: '',
        icon: 'map-pin',
        order: 0
    };

    const [formData, setFormData] = useState<any>(defaultFormData);
    const [initialState, setInitialState] = useState<any>(defaultFormData);
    const [currentId, setCurrentId] = useState<string | null>(null);

    useEffect(() => {
        fetchServices();
    }, []);

    // Sync isDirty
    useEffect(() => {
        const dirty = JSON.stringify(formData) !== JSON.stringify(initialState);
        setIsDirty(dirty);
    }, [formData, initialState, setIsDirty]);

    // Register Save Handler
    useEffect(() => {
        if (view === 'editor') {
            registerSaveHandler(async () => {
                await handleSave(true); // true = redirect after save
            });
        } else {
            registerSaveHandler(null);
        }
        return () => registerSaveHandler(null);
    }, [view, formData, currentId]); // Depend on formData/id to capture current state in closure

    // Handle URL State
    useEffect(() => {
        const action = searchParams.get('action');
        const id = searchParams.get('id');

        if (!isLoading) {
            if (action === 'new') {
                const initial = { ...defaultFormData, order: services.length + 1 };
                setFormData(initial);
                setInitialState(initial);
                setCurrentId(null);
            } else if (action === 'edit' && id) {
                const service = services.find(s => s.id === id);
                if (service) {
                    const data = {
                        title: service.title,
                        description: service.description,
                        icon: service.icon || 'map-pin',
                        order: service.order
                    };
                    setFormData(data);
                    setInitialState(data);
                    setCurrentId(id);
                }
            }
        }
    }, [searchParams, isLoading, services]);

    const fetchServices = async () => {
        try {
            setIsLoading(true);
            const data = await apiRequest('/services');
            setServices(data || []);
        } catch (error) {
            console.error('Failed to fetch services:', error);
            showToast('Failed to load services', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = () => {
        router.push('/dashboard/services?action=new');
    };

    const handleEdit = (service: Service) => {
        router.push(`/dashboard/services?action=edit&id=${service.id}`);
    };

    const handleBack = () => {
        if (JSON.stringify(formData) !== JSON.stringify(initialState)) {
            setShowExitAlert(true);
        } else {
            router.push('/dashboard/services');
        }
    };

    const confirmDiscard = () => {
        setShowExitAlert(false);
        setIsDirty(false);
        router.push('/dashboard/services');
    };

    const handleSave = async (redirect = false) => {
        setIsSaving(true);
        const url = currentId ? `/services/${currentId}` : '/services';
        const method = currentId ? 'PATCH' : 'POST';

        try {
            await apiRequest(url, {
                method,
                body: { ...formData, order: Number(formData.order) },
                skipNotification: true
            });

            showToast(`Service ${currentId ? 'updated' : 'created'} successfully`, 'success');
            setIsDirty(false);
            if (redirect) {
                fetchServices(); // Refresh list before navigating back
                router.push('/dashboard/services');
            } else {
                fetchServices(); // Refresh list if staying (though usually redirects)
                // If staying, update initial state to match new saved state
                // But typically we redirect or stay. If staying, currentId might change if was 'new'
            }
            if (!redirect && !currentId) {
                // If it was a create action and we didn't redirect, we need to handle state update.
                // But for now, assuming standard flow
            }
        } catch (error: any) {
            showToast(error.message || 'Failed to save service', 'error');
            throw error; // Propagate for saveHandler
        } finally {
            setIsSaving(false);
            setShowExitAlert(false);
        }
    };

    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; serviceId: string | null }>({
        isOpen: false,
        serviceId: null
    });

    const handleDeleteClick = (id: string) => {
        setDeleteConfirmation({ isOpen: true, serviceId: id });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation.serviceId) return;

        try {
            await apiRequest(`/services/${deleteConfirmation.serviceId}`, { method: 'DELETE' });
            showToast('Service deleted successfully', 'success');
            fetchServices();
            setDeleteConfirmation({ isOpen: false, serviceId: null });
        } catch (error) {
            console.error('Failed to delete service:', error);
            showToast('Failed to delete service', 'error');
            setDeleteConfirmation({ isOpen: false, serviceId: null });
        }
    };

    const cancelDelete = () => {
        setDeleteConfirmation({ isOpen: false, serviceId: null });
    };

    if (view === 'editor') {
        return (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all"
                        >
                            <ArrowLeftIcon className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 font-display tracking-tight">
                                {currentId ? 'Edit Service' : 'New Service'}
                            </h1>
                            <p className="text-sm font-medium text-slate-500">Define service details and iconography.</p>
                        </div>
                    </div>
                </div>

                <ThemeCompatibilityBanner moduleName="services" />

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Service Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            disabled={!isSupported}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white focus:border-blue-600 transition-all disabled:opacity-50"
                            placeholder="e.g. Architectural Design"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Description</label>
                        <textarea
                             value={formData.description}
                            disabled={!isSupported}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white focus:border-blue-600 transition-all resize-none disabled:opacity-50"
                            placeholder="Brief description of the service..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Display Order</label>
                        <input
                            type="number"
                             value={formData.order}
                            disabled={!isSupported}
                            onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white focus:border-blue-600 transition-all disabled:opacity-50"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700">Service Icon</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {SERVICE_ICONS.map((item) => {
                                const isSelected = formData.icon === item.name;
                                return (
                                    <button
                                        key={item.name}
                                        type="button"
                                        onClick={() => !isSupported ? undefined : setFormData({ ...formData, icon: item.name })}
                                        style={{ pointerEvents: isSupported ? 'auto' : 'none' }}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${isSelected
                                            ? 'border-red-500 bg-red-50 text-red-600'
                                            : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                                        }`}
                                    >
                                        {item.svg}
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all"
                        >
                            Cancel
                        </button>
                         <button
                            onClick={() => handleSave(true)}
                            disabled={isSaving || !isSupported}
                            className="inline-flex items-center gap-2 px-8 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <CloudArrowUpIcon className="h-5 w-5" strokeWidth={2} />
                            )}
                            <span>{!isSupported ? 'Unsupported by Theme' : (currentId ? 'Update Service' : 'Create Service')}</span>
                        </button>
                    </div>
                </div>
                <UnsavedChangesAlert
                    isOpen={showExitAlert}
                    onSaveAndExit={() => handleSave(true)}
                    onDiscardAndExit={confirmDiscard}
                    onCancel={() => setShowExitAlert(false)}
                    title="Unsaved Changes"
                    description="You have unsaved changes. dealing with them now?"
                    confirmLabel="Save & Exit"
                    secondaryLabel="Discard & Leave"
                    cancelLabel="Keep Editing"
                    variant="success"
                />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
                        Services <span className="text-blue-600">Management</span>
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 font-semibold tracking-tight">
                        Manage your service offerings and their display order.
                    </p>
                </div>
                 <button
                    onClick={handleCreate}
                    disabled={!isSupported}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 shadow-lg shadow-emerald-600/30 text-white font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 hover:-translate-y-0.5 transition-all active:translate-y-0 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                    <PlusIcon className="h-4 w-4" />
                    New Service
                </button>
            </div>

            <ThemeCompatibilityBanner moduleName="services" />

            {/* List */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 flex justify-center">
                        <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                ) : services.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-slate-400 font-medium">No services found. Create one to get started.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-full">Title</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Updated</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {services.map((service) => {
                                    const iconEntry = SERVICE_ICONS.find(i => i.name === service.icon) || SERVICE_ICONS[0];
                                    return (
                                        <tr key={service.id} className="group hover:bg-blue-50/30 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs">
                                                    {service.order}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                                                        {iconEntry.svg}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{service.title}</p>
                                                        <p className="text-xs text-slate-500 line-clamp-1">{service.description}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-xs font-semibold text-slate-500">
                                                    {new Date(service.updatedAt).toLocaleDateString()}
                                                </p>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(service)}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                    >
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(service.id)}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>


            <AlertDialog
                isOpen={deleteConfirmation.isOpen}
                title="Delete Service"
                description="Are you sure you want to delete this service? This action cannot be undone."
                confirmLabel="Delete Service"
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        </div >
    );
}

export default function ServicesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        }>
            <ServicesPageContent />
        </Suspense>
    );
}
