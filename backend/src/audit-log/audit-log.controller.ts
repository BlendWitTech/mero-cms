import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditLogController {
    constructor(private readonly auditLogService: AuditLogService) { }

    @Get()
    @RequirePermissions(Permission.AUDIT_VIEW)
    async getLogs(@Request() req, @Query('limit') limit: string) {
        const user = req.user;
        const limitNum = limit ? parseInt(limit) : 50;
        const isAdmin = user.role === 'Admin' || user.role === 'SuperAdmin';
        return this.auditLogService.findAll(isAdmin ? undefined : user.sub, limitNum);
    }

    @Get('paginated')
    @RequirePermissions(Permission.AUDIT_VIEW)
    async getPaginated(
        @Request() req,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('action') action?: string,
        @Query('status') status?: string,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        const user = req.user;
        const isAdmin = user.role === 'Admin' || user.role === 'SuperAdmin';

        return this.auditLogService.findPaginated({
            userId: isAdmin ? undefined : user.sub,
            action,
            status,
            from,
            to,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
        });
    }
}
