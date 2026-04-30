import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { PackageEnforcementGuard } from '../packages/package-enforcement.guard';
import { RequireLimit, PackageLimit } from '../packages/require-limit.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { AuditLogService } from '../audit-log/audit-log.service';

/**
 * API Key management endpoints. Every route is gated behind API_ACCESS so
 * only tiers with hasApiAccess (Personal Professional/Custom, Org
 * Enterprise/Custom) can reach it.
 */
@Controller('api-keys')
@UseGuards(JwtAuthGuard, PermissionsGuard, PackageEnforcementGuard)
@RequireLimit(PackageLimit.API_ACCESS)
export class ApiKeysController {
    constructor(
        private readonly service: ApiKeysService,
        private readonly audit: AuditLogService,
    ) {}

    @Get()
    @RequirePermissions(Permission.SETTINGS_VIEW)
    async list(@Request() req) {
        return this.service.list(req.user.id);
    }

    @Post()
    @RequirePermissions(Permission.SETTINGS_EDIT)
    async create(
        @Request() req,
        @Body() body: { name: string; scopes?: string[]; expiresAt?: string | null },
    ) {
        const key = await this.service.create(req.user.id, {
            name: body.name,
            scopes: Array.isArray(body.scopes) ? body.scopes : [],
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        });
        await this.audit.log(req.user.id, 'API_KEY_CREATE', {
            name: key.name,
            prefix: key.prefix,
            scopes: key.scopes.join(',') || 'none',
        });
        // One-time return of the raw token. The UI must make this obvious.
        return key;
    }

    @Delete(':id')
    @RequirePermissions(Permission.SETTINGS_EDIT)
    async revoke(@Request() req, @Param('id') id: string) {
        const result = await this.service.revoke(req.user.id, id);
        await this.audit.log(req.user.id, 'API_KEY_REVOKE', {
            id,
            name: result.name,
            prefix: result.prefix,
        }, 'WARNING');
        return result;
    }
}
