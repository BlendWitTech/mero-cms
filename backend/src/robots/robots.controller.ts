import { Controller, Get, Post, Body, Header, UseGuards, Request } from '@nestjs/common';
import { RobotsService } from './robots.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { RequireModule } from '../setup/require-module.decorator';
import { PackageEnforcementGuard } from '../packages/package-enforcement.guard';
import { RequireLimit, PackageLimit } from '../packages/require-limit.decorator';

@RequireModule('robots')
@Controller()
export class RobotsController {
    constructor(
        private readonly robotsService: RobotsService,
        private readonly auditLog: AuditLogService,
    ) { }

    // Public — theme needs this for SEO
    @Get('robots.txt')
    @Header('Content-Type', 'text/plain')
    async getRobotsTxt() {
        return this.robotsService.getRobotsTxt();
    }

    // Admin — gated behind SEO_FULL (Premium+)
    @Get('api/robots')
    @UseGuards(JwtAuthGuard, PermissionsGuard, PackageEnforcementGuard)
    @RequireLimit(PackageLimit.SEO_FULL)
    @RequirePermissions(Permission.SEO_MANAGE)
    async getConfig() {
        return this.robotsService.getConfig();
    }

    @Post('api/robots')
    @UseGuards(JwtAuthGuard, PermissionsGuard, PackageEnforcementGuard)
    @RequireLimit(PackageLimit.SEO_FULL)
    @RequirePermissions(Permission.SEO_MANAGE)
    async updateRobotsTxt(@Body() data: { content: string }, @Request() req) {
        const result = await this.robotsService.updateRobotsTxt(data.content);
        await this.auditLog.log(req.user.id, 'ROBOTS_TXT_UPDATE', {});
        return result;
    }
}
