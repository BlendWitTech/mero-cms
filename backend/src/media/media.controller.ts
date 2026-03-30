import {
    Controller,
    Post,
    Get,
    Patch,
    Body,
    Delete,
    Param,
    UseInterceptors,
    UploadedFiles,
    UseGuards,
    Request,
    BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IpGuard } from '../auth/ip.guard';
import { AuditLogService } from '../audit-log/audit-log.service';

import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';

@UseGuards(JwtAuthGuard, IpGuard, PermissionsGuard)
@Controller('media')
export class MediaController {
    constructor(
        private readonly mediaService: MediaService,
        private readonly auditLog: AuditLogService
    ) { }

    @Get()
    @RequirePermissions(Permission.MEDIA_VIEW)
    findAll() {
        return this.mediaService.findAll();
    }

    @Patch(':id')
    @RequirePermissions(Permission.MEDIA_UPLOAD)
    update(@Param('id') id: string, @Body() data: { altText?: string, folder?: string }) {
        return this.mediaService.update(id, data);
    }

    @Post('upload')
    @RequirePermissions(Permission.MEDIA_UPLOAD)
    @UseInterceptors(
        FilesInterceptor('files', 10, {
            storage: diskStorage({
                destination: './uploads',
                filename: (req, file, cb) => {
                    const randomName = Array(32)
                        .fill(null)
                        .map(() => Math.round(Math.random() * 16).toString(16))
                        .join('');
                    cb(null, `${randomName}${extname(file.originalname)}`);
                },
            }),
            fileFilter: (req, file, cb) => {
                const ALLOWED_MIMES = new Set([
                    'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
                    'image/webp', 'image/svg+xml', 'image/avif',
                    'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo',
                    'application/pdf',
                    'model/gltf-binary', 'model/gltf+json',
                    'application/octet-stream', // .glb files often use this
                ]);
                if (!ALLOWED_MIMES.has(file.mimetype)) {
                    return cb(new BadRequestException(`File type "${file.mimetype}" is not allowed`), false);
                }
                cb(null, true);
            },
        }),
    )
    async uploadFiles(@UploadedFiles() files: Express.Multer.File[], @Request() req) {
        const results: any[] = [];
        for (const file of files) {
            const result = await this.mediaService.create(file);
            results.push(result);
        }
        await this.auditLog.log(req.user.id, 'MEDIA_UPLOAD', { count: files.length, filenames: files.map(f => f.originalname) });
        return results;
    }

    @Delete(':id')
    @RequirePermissions(Permission.MEDIA_DELETE)
    async remove(@Param('id') id: string, @Request() req) {
        const res = await this.mediaService.remove(id);
        await this.auditLog.log(req.user.id, 'MEDIA_DELETE', { id });
        return res;
    }

    @Post('migrate')
    @RequirePermissions(Permission.SETTINGS_EDIT)
    async migrate(@Request() req) {
        const results = await this.mediaService.migrateLocalToCloud();
        await this.auditLog.log(req.user.id, 'MEDIA_MIGRATE_TO_CLOUD', results);
        return results;
    }

    @Get('folders')
    @RequirePermissions(Permission.MEDIA_VIEW)
    listFolders() {
        return this.mediaService.listFolders();
    }

    @Patch('folders/rename')
    @RequirePermissions(Permission.MEDIA_UPLOAD)
    renameFolder(@Body() body: { oldName: string; newName: string }) {
        return this.mediaService.renameFolder(body.oldName, body.newName);
    }

    @Delete('folders/:name')
    @RequirePermissions(Permission.MEDIA_DELETE)
    deleteFolder(@Param('name') name: string) {
        return this.mediaService.deleteFolder(name);
    }
}
