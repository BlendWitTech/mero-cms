import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Query,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ThemeEditorService } from './theme-editor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { PackageEnforcementGuard } from '../packages/package-enforcement.guard';
import { RequireLimit, PackageLimit } from '../packages/require-limit.decorator';
import { AuditLogService } from '../audit-log/audit-log.service';

/**
 * Code-level theme editor endpoints. All gated behind THEME_CODE_EDIT
 * (Professional+ and Enterprise plans). Permission check: THEMES_MANAGE —
 * same role permission used elsewhere for destructive theme ops.
 */
@Controller('theme-editor')
@UseGuards(JwtAuthGuard, PermissionsGuard, PackageEnforcementGuard)
@RequireLimit(PackageLimit.THEME_CODE_EDIT)
@RequirePermissions(Permission.THEMES_MANAGE)
export class ThemeEditorController {
    constructor(
        private readonly editor: ThemeEditorService,
        private readonly auditLog: AuditLogService,
    ) {}

    @Get('tree')
    async getTree() {
        return this.editor.getTree();
    }

    @Get('file')
    async getFile(@Query('path') relPath: string) {
        return this.editor.readFile(relPath);
    }

    @Put('file')
    async writeFile(
        @Body() body: { path: string; content: string; revalidate?: boolean },
        @Request() req: any,
    ) {
        const result = await this.editor.writeFile(body.path, body.content);
        await this.auditLog.log(req.user.id, 'THEME_FILE_EDIT', {
            path: result.path,
            size: result.size,
        });
        if (body.revalidate !== false) {
            const revalidation = await this.editor.pingRevalidate();
            return { ...result, revalidation };
        }
        return result;
    }

    @Post('file')
    async createFile(
        @Body() body: { path: string; content?: string },
        @Request() req: any,
    ) {
        const result = await this.editor.createFile(body.path, body.content ?? '');
        await this.auditLog.log(req.user.id, 'THEME_FILE_CREATE', {
            path: result.path,
            size: result.size,
        });
        return result;
    }

    @Delete('file')
    async deleteFile(@Query('path') relPath: string, @Request() req: any) {
        const result = await this.editor.deleteFile(relPath);
        await this.auditLog.log(req.user.id, 'THEME_FILE_DELETE', {
            path: result.path,
        }, 'WARNING');
        return result;
    }

    @Post('revalidate')
    async revalidate() {
        return this.editor.pingRevalidate();
    }
}
