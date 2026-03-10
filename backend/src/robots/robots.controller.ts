import { Controller, Get, Post, Body, Header, UseGuards, Request } from '@nestjs/common';
import { RobotsService } from './robots.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { RequireModule } from '../setup/require-module.decorator';

@RequireModule('robots')
@Controller()
export class RobotsController {
    constructor(
        private readonly robotsService: RobotsService,
        private readonly auditLog: AuditLogService,
    ) { }

    @Get('robots.txt')
    @Header('Content-Type', 'text/plain')
    async getRobotsTxt() {
        return this.robotsService.getRobotsTxt();
    }

    @Get('api/robots')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.SEO_MANAGE)
    async getConfig() {
        return this.robotsService.getConfig();
    }

    @Post('api/robots')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.SEO_MANAGE)
    async updateRobotsTxt(@Body() data: { content: string }, @Request() req) {
        const result = await this.robotsService.updateRobotsTxt(data.content);
        await this.auditLog.log(req.user.id, 'ROBOTS_TXT_UPDATE', {});
        return result;
    }
}
