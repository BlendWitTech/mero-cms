import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { RedirectsService } from './redirects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { RequireModule } from '../setup/require-module.decorator';
import { PackageEnforcementGuard } from '../packages/package-enforcement.guard';
import { RequireLimit, PackageLimit } from '../packages/require-limit.decorator';

@RequireModule('redirects')
@Controller('redirects')
@UseGuards(JwtAuthGuard, PermissionsGuard, PackageEnforcementGuard)
@RequireLimit(PackageLimit.SEO_FULL)
export class RedirectsController {
    constructor(
        private readonly redirectsService: RedirectsService,
        private readonly auditLog: AuditLogService,
    ) { }

    @Get()
    @RequirePermissions(Permission.SEO_MANAGE)
    async findAll() {
        return this.redirectsService.findAll();
    }

    @Get('check/:path')
    async checkRedirect(@Param('path') path: string) {
        return this.redirectsService.checkRedirect(path);
    }

    @Post()
    @RequirePermissions(Permission.SEO_MANAGE)
    async create(@Body() data: any, @Request() req) {
        const result = await this.redirectsService.create(data);
        await this.auditLog.log(
            req.user.id,
            'REDIRECT_CREATE',
            { fromPath: data.fromPath, toPath: data.toPath },
        );
        return result;
    }

    @Patch(':id')
    @RequirePermissions(Permission.SEO_MANAGE)
    async update(@Param('id') id: string, @Body() data: any, @Request() req) {
        const result = await this.redirectsService.update(id, data);
        await this.auditLog.log(req.user.id, 'REDIRECT_UPDATE', { id });
        return result;
    }

    @Delete(':id')
    @RequirePermissions(Permission.SEO_MANAGE)
    async delete(@Param('id') id: string, @Request() req) {
        const result = await this.redirectsService.delete(id);
        await this.auditLog.log(req.user.id, 'REDIRECT_DELETE', { id });
        return result;
    }
}
