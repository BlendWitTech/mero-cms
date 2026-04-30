import { SetMetadata } from '@nestjs/common';

export enum PackageLimit {
    // Usage-based limits (enforced against live counts)
    TEAM_SIZE = 'TEAM_SIZE',
    STORAGE = 'STORAGE',
    THEME_COUNT = 'THEME_COUNT',

    // Feature gates (boolean capabilities)
    WHITE_LABEL = 'WHITE_LABEL',
    API_ACCESS = 'API_ACCESS',
    AI_STUDIO = 'AI_STUDIO',
    PLUGIN_MARKETPLACE = 'PLUGIN_MARKETPLACE',
    THEME_CODE_EDIT = 'THEME_CODE_EDIT',
    VISUAL_THEME_EDITOR = 'VISUAL_THEME_EDITOR',
    DASHBOARD_BRANDING = 'DASHBOARD_BRANDING',
    WEBHOOKS = 'WEBHOOKS',
    COLLECTIONS = 'COLLECTIONS',
    FORMS = 'FORMS',
    ANALYTICS = 'ANALYTICS',
    AUDIT_LOG = 'AUDIT_LOG',
    SITE_EDITOR = 'SITE_EDITOR',
    SEO_FULL = 'SEO_FULL',
}

export const REQUIRE_LIMIT_KEY = 'require_limit';
export const RequireLimit = (limit: PackageLimit) => SetMetadata(REQUIRE_LIMIT_KEY, limit);
