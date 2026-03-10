// Permission utility functions for role-based access control

export interface UserPermissions {
    users_view?: boolean;
    users_create?: boolean;
    users_edit?: boolean;
    users_delete?: boolean;
    users_deactivate?: boolean;
    users_reactivate?: boolean;
    roles_view?: boolean;
    roles_create?: boolean;
    roles_edit?: boolean;
    roles_delete?: boolean;
    content_view?: boolean;
    content_create?: boolean;
    content_edit?: boolean;
    content_delete?: boolean;
    media_view?: boolean;
    media_upload?: boolean;
    media_delete?: boolean;
    settings_edit?: boolean;
    audit_view?: boolean;
    analytics_view?: boolean;
    seo_manage?: boolean;
    all?: boolean;
}

/**
 * Check if user has required permission(s)
 * @param userPermissions - User's permission object
 * @param required - Single permission string or array of permissions (user needs ANY of them)
 * @returns true if user has permission
 */
export const checkPermission = (
    userPermissions: UserPermissions | null | undefined,
    required: string | string[]
): boolean => {
    if (!userPermissions) return false;

    // Super Admin has all permissions
    if (userPermissions.all) return true;

    // Check if user has any of the required permissions
    const permissions = Array.isArray(required) ? required : [required];
    return permissions.some(perm => userPermissions[perm as keyof UserPermissions] === true);
};

/**
 * Filter navigation items based on user permissions and enabled modules
 * @param navigation - Array of navigation items
 * @param userPermissions - User's permission object
 * @param enabledModules - Array of enabled module names (optional)
 * @returns Filtered navigation array
 */
export const getVisibleNavItems = (
    navigation: any[],
    userPermissions: UserPermissions | null | undefined,
    enabledModules?: string[]
): any[] => {
    if (!userPermissions) return [];

    return navigation
        .filter(item => {
            // Module check: hide items for disabled modules
            if (item.requiresModule && enabledModules !== undefined) {
                if (!enabledModules.includes(item.requiresModule)) return false;
            }

            // Permission check: if no permission required, show to everyone
            if (!item.requiredPermission) return true;

            return checkPermission(userPermissions, item.requiredPermission);
        })
        .map(item => {
            // Recursively filter children
            if (item.children) {
                return {
                    ...item,
                    children: getVisibleNavItems(item.children, userPermissions, enabledModules)
                };
            }
            return item;
        })
        .filter(item => {
            // Remove parent items that have no visible children
            if (item.children) {
                return item.children.length > 0;
            }
            return true;
        });
};

/**
 * Get visible dashboard stats based on permissions
 * @param stats - Array of stat objects
 * @param userPermissions - User's permission object
 * @returns Filtered stats array
 */
export const getVisibleStats = (
    stats: any[],
    userPermissions: UserPermissions | null | undefined
): any[] => {
    if (!userPermissions) return [];

    return stats.filter(stat => {
        switch (stat.name) {
            case 'Total Posts':
            case 'Published':
                return checkPermission(userPermissions, 'content_view');
            case 'Active Users':
            case 'Team Members':
                return checkPermission(userPermissions, 'users_view');
            case 'Media files':
            case 'Storage':
                return checkPermission(userPermissions, 'media_view');
            case 'Page Views':
            case 'Analytics':
                return checkPermission(userPermissions, 'analytics_view');
            default:
                return true; // Show unknown stats by default
        }
    });
};
