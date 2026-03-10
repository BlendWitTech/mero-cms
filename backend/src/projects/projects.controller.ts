import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { RequireModule } from '../setup/require-module.decorator';

@RequireModule('projects')
@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_CREATE)
    @Post()
    create(@Body() createProjectDto: any) {
        return this.projectsService.create(createProjectDto);
    }

    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_VIEW)
    @Get()
    findAll(@Query('status') status?: string, @Query('category') category?: string, @Query('featured') featured?: string) {
        return this.projectsService.findAll(status, category, featured === 'true');
    }

    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_VIEW)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.projectsService.findById(id);
    }

    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_EDIT)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateProjectDto: any) {
        return this.projectsService.update(id, updateProjectDto);
    }

    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_DELETE)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.projectsService.remove(id);
    }

    // Public routes
    @Get('public/list')
    getPublished(@Query('page') page?: string, @Query('limit') limit?: string, @Query('category') category?: string) {
        return this.projectsService.findPublished(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 10,
            category
        );
    }

    @Get('public/featured')
    getFeatured() {
        return this.projectsService.findFeatured();
    }

    @Get('public/:slug')
    getBySlug(@Param('slug') slug: string) {
        return this.projectsService.findOne(slug);
    }
}
