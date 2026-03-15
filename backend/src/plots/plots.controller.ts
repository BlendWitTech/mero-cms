import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { PlotsService } from './plots.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { RequireModule } from '../setup/require-module.decorator';

@RequireModule('plots')
@Controller('plots')
export class PlotsController {
    constructor(private readonly plotsService: PlotsService) {}

    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_CREATE)
    @Post()
    create(@Body() dto: any) {
        return this.plotsService.create(dto);
    }

    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_VIEW)
    @Get()
    findAll(
        @Query('status') status?: string,
        @Query('category') category?: string,
        @Query('featured') featured?: string,
    ) {
        return this.plotsService.findAll(status, category, featured !== undefined ? featured === 'true' : undefined);
    }

    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_VIEW)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.plotsService.findById(id);
    }

    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_EDIT)
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: any) {
        return this.plotsService.update(id, dto);
    }

    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_DELETE)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.plotsService.remove(id);
    }

    // Public routes
    @Get('public/list')
    getPublished(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('category') category?: string,
    ) {
        return this.plotsService.findPublished(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 10,
            category,
        );
    }

    @Get('public/featured')
    getFeatured() {
        return this.plotsService.findFeatured();
    }

    @Get('public/:slug')
    getBySlug(@Param('slug') slug: string) {
        return this.plotsService.findOne(slug);
    }
}
