import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SeoMetaService } from './seo-meta.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { RequireModule } from '../setup/require-module.decorator';

@RequireModule('seo')
@Controller('seo-meta')
// @UseGuards(JwtAuthGuard) - Removed global guard to verify per-endpoint
export class SeoMetaController {
    constructor(
        private readonly seoMetaService: SeoMetaService,
        private readonly auditLog: AuditLogService,
    ) { }

    @Get('stats')
    async getStats() {
        return this.seoMetaService.getDashboardStats();
    }

    @Get('content-list')
    async getContentList() {
        return this.seoMetaService.getContentList();
    }

    @Get(':pageType')
    async findByPageType(@Param('pageType') pageType: string) {
        return this.seoMetaService.findByPage(pageType);
    }

    @Get(':pageType/:pageId')
    async findByPageid(
        @Param('pageType') pageType: string,
        @Param('pageId') pageId: string,
    ) {
        return this.seoMetaService.findByPage(pageType, pageId);
    }

    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.SEO_MANAGE)
    @Post()
    async upsert(@Body() data: any, @Request() req) {
        const result = await this.seoMetaService.upsert(data);
        await this.auditLog.log(
            req.user.id,
            'SEO_META_UPDATE',
            { pageType: data.pageType, pageId: data.pageId },
        );
        return result;
    }

    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.SEO_MANAGE)
    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req) {
        const result = await this.seoMetaService.delete(id);
        await this.auditLog.log(req.user.id, 'SEO_META_DELETE', { id });
        return result;
    }

    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.SEO_MANAGE)
    @Post('analyze')
    async analyze(@Body() data: { content: string; meta: any }) {
        return this.seoMetaService.analyzeSeo(data.content, data.meta);
    }
}
