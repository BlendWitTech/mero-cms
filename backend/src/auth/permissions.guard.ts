import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { Permission } from './permissions.enum';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private auditLogService: AuditLogService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredPermissions) return true;

        const request = context.switchToHttp().getRequest();
        const { user } = request;

        if (!user || !user.role) return false;

        // Super Admin bypass
        if (user.role === 'Super Admin' || user.role?.name === 'Super Admin') return true;

        const userPermissions = user.role.permissions || {};

        // 'all' permission bypass
        if (userPermissions.all === true) return true;

        const granted = requiredPermissions.some(p => userPermissions[p] === true);

        if (!granted && user.sub) {
            // Fire-and-forget — never let audit logging block the request
            this.auditLogService.log(
                user.sub,
                'PERMISSION_DENIED',
                {
                    required: requiredPermissions,
                    role: user.role?.name ?? user.role,
                    path: request.url,
                    method: request.method,
                },
                'WARNING',
            ).catch(() => { });
        }

        return granted;
    }
}
