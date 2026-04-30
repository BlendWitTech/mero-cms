import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { PackageEnforcementGuard } from '../packages/package-enforcement.guard';
import { RequireLimit, PackageLimit } from '../packages/require-limit.decorator';

@UseGuards(JwtAuthGuard, PackageEnforcementGuard)
@RequireLimit(PackageLimit.COLLECTIONS)
@Controller('collections')
export class CollectionsController {
    constructor(private readonly collectionsService: CollectionsService) { }

    @Post()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.SETTINGS_EDIT)
    create(@Body() dto: any) {
        return this.collectionsService.create(dto);
    }

    @Get()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_VIEW)
    findAll() {
        return this.collectionsService.findAll();
    }

    @Get('slug/:slug')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_VIEW)
    findBySlug(@Param('slug') slug: string) {
        return this.collectionsService.findBySlug(slug);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_VIEW)
    findOne(@Param('id') id: string) {
        return this.collectionsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.SETTINGS_EDIT)
    update(@Param('id') id: string, @Body() dto: any) {
        return this.collectionsService.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.SETTINGS_EDIT)
    remove(@Param('id') id: string) {
        return this.collectionsService.remove(id);
    }
}
