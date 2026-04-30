'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/api';
import { UserPermissions, checkPermission } from '@/lib/permissions';

interface PermissionsContextType {
    permissions: UserPermissions | null;
    userRole: string | null;
    license: any | null;
    isLoading: boolean;
    hasPermission: (required: string | string[]) => boolean;
    refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType>({
    permissions: null,
    userRole: null,
    license: null,
    isLoading: true,
    hasPermission: () => false,
    refreshPermissions: async () => { }
});

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
    const [permissions, setPermissions] = useState<UserPermissions | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [license, setLicense] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPermissions = async () => {
        try {
            const profile = await apiRequest('/auth/profile');
            setPermissions(profile.role?.permissions || {});
            setUserRole(profile.role?.name || null);
            setLicense(profile.license || null);
        } catch (error) {
            console.error('Failed to fetch permissions:', error);
            setPermissions({});
            setUserRole(null);
            setLicense(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, []);

    const hasPermission = (required: string | string[]) => {
        return checkPermission(permissions, required);
    };

    return (
        <PermissionsContext.Provider
            value={{
                permissions,
                userRole,
                license,
                isLoading,
                hasPermission,
                refreshPermissions: fetchPermissions
            }}
        >
            {children}
        </PermissionsContext.Provider>
    );
};

export const usePermissions = () => {
    const context = useContext(PermissionsContext);
    if (!context) {
        throw new Error('usePermissions must be used within a PermissionsProvider');
    }
    return context;
};
