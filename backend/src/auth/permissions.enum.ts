export enum Permission {
    // Users
    USERS_VIEW = 'users_view',
    USERS_CREATE = 'users_create',
    USERS_EDIT = 'users_edit',
    USERS_DELETE = 'users_delete',
    USERS_DEACTIVATE = 'users_deactivate',
    USERS_REACTIVATE = 'users_reactivate',

    // Roles
    ROLES_VIEW = 'roles_view',
    ROLES_CREATE = 'roles_create',
    ROLES_EDIT = 'roles_edit',
    ROLES_DELETE = 'roles_delete',

    // Content (Projects, Blogs, Pages, etc.)
    CONTENT_VIEW = 'content_view',
    CONTENT_CREATE = 'content_create',
    CONTENT_EDIT = 'content_edit',
    CONTENT_DELETE = 'content_delete',

    // Media
    MEDIA_VIEW = 'media_view',
    MEDIA_UPLOAD = 'media_upload',
    MEDIA_DELETE = 'media_delete',

    // System & Settings
    SETTINGS_VIEW = 'settings_view',
    SETTINGS_EDIT = 'settings_edit',
    AUDIT_VIEW = 'audit_view',
    THEMES_MANAGE = 'themes_manage',
    MENUS_MANAGE = 'menus_manage',

    // Marketing & SEO
    ANALYTICS_VIEW = 'analytics_view',
    SEO_MANAGE = 'seo_manage',
    LEADS_VIEW = 'leads_view',
    LEADS_MANAGE = 'leads_manage',
}
