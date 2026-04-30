'use client';

import React from 'react';
import MediaLibrary from '@/components/media/MediaLibrary';
import PageHeader from '@/components/ui/PageHeader';

export default function MediaPage() {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <PageHeader 
                title="Digital" 
                accent="Assets" 
                subtitle="Cloud Infrastructure / Storage" 
            />

            <MediaLibrary isStandalone />
        </div>
    );
}
