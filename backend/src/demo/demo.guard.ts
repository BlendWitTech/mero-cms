import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DEMO_SAFE_KEY } from './demo-safe.decorator';

/**
 * When DEMO_MODE=true this guard blocks any mutating HTTP method
 * on protected route prefixes to prevent visitors from damaging the demo.
 *
 * Rules:
 * - GET / HEAD / OPTIONS are always allowed.
 * - Routes decorated with @DemoSafe() are always allowed.
 * - All other non-GET requests to the BLOCKED_PREFIXES list are rejected.
 * - Content creation/editing (blogs, pages, collections, etc.) IS allowed so
 *   visitors can try the editor experience.
 */

const BLOCKED_PREFIXES = [
    '/users',
    '/roles',
    '/invitations',
    '/settings',
    '/setup',
    '/themes',           // prevent theme switching / deletion
    '/auth/register',
    '/auth/change-password',
    '/auth/2fa',
];

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class DemoGuard implements CanActivate {
    private readonly isDemoMode = process.env.DEMO_MODE === 'true';

    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        if (!this.isDemoMode) return true;

        // Allow if endpoint is explicitly marked safe
        const isSafe = this.reflector.getAllAndOverride<boolean>(DEMO_SAFE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isSafe) return true;

        const req = context.switchToHttp().getRequest();
        if (SAFE_METHODS.has(req.method)) return true;

        const path: string = req.path || '';

        const isBlocked = BLOCKED_PREFIXES.some(prefix =>
            path === prefix ||
            path.startsWith(prefix + '/') ||
            path.startsWith('/api' + prefix) ||
            path.startsWith('/api' + prefix + '/'),
        );

        if (isBlocked) {
            throw new ForbiddenException(
                'This action is disabled in demo mode. Reset happens every 2 hours.',
            );
        }

        return true;
    }
}
