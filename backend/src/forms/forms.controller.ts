import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res } from '@nestjs/common';
import type { Response } from 'express';
import { FormsService } from './forms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { PackageEnforcementGuard } from '../packages/package-enforcement.guard';
import { RequireLimit, PackageLimit } from '../packages/require-limit.decorator';

@UseGuards(JwtAuthGuard, PackageEnforcementGuard)
@RequireLimit(PackageLimit.FORMS)
@Controller('forms')
export class FormsController {
    constructor(private readonly formsService: FormsService) { }

    @Post()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.SETTINGS_EDIT)
    create(@Body() dto: any) {
        return this.formsService.create(dto);
    }

    @Get()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_VIEW)
    findAll() {
        return this.formsService.findAll();
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_VIEW)
    findOne(@Param('id') id: string) {
        return this.formsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.SETTINGS_EDIT)
    update(@Param('id') id: string, @Body() dto: any) {
        return this.formsService.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.SETTINGS_EDIT)
    remove(@Param('id') id: string) {
        return this.formsService.remove(id);
    }

    @Get(':id/submissions')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_VIEW)
    getSubmissions(@Param('id') id: string) {
        return this.formsService.getSubmissions(id);
    }

    @Delete(':formId/submissions/:submissionId')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_DELETE)
    deleteSubmission(@Param('submissionId') submissionId: string) {
        return this.formsService.deleteSubmission(submissionId);
    }

    @Get(':id/submissions/export/csv')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_VIEW)
    async exportSubmissionsCsv(@Param('id') id: string, @Res() res: Response) {
        const csv = await this.formsService.exportSubmissionsCsv(id);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="form-${id}-submissions.csv"`);
        res.send(csv);
    }
}
