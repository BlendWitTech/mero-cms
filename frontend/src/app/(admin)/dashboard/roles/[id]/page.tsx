'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RoleForm from '@/components/roles/RoleForm';
import { useNotification } from '@/context/NotificationContext';
import { use } from 'react';
import { apiRequest } from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { showToast } = useNotification();
    const [role, setRole] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRole = async () => {
            try {
                const data = await apiRequest(`/roles/${resolvedParams.id}`);
                setRole(data);
            } catch (error) {
                console.error(error);
                // apiRequest handles error toasts by default.
                // If fetching fails, redirect to roles list.
                router.push('/dashboard/roles');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRole();
    }, [resolvedParams.id, router]);

    const handleSave = async (data: any) => {
        try {
            await apiRequest(`/roles/${resolvedParams.id}`, {
                method: 'PATCH',
                body: data,
                skipNotification: true // We handle success/error notifications manually here
            });
            showToast('Role updated successfully', 'success');
            router.push('/dashboard/roles');
        } catch (error: any) {
            // Since skipNotification was true, we must show the error toast manually.
            showToast(error.message || 'Failed to update role', 'error');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!role) return null;

    return (
        <RoleForm
            title="Edit Role"
            subtitle={`Edit permissions for ${role.name}`}
            initialData={role}
            onSave={handleSave}
        />
    );
}
