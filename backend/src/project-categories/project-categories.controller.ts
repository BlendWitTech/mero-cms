import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProjectCategoriesService } from './project-categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { RequireModule } from '../setup/require-module.decorator';

@RequireModule('project-categories')
@Controller('project-categories')
export class ProjectCategoriesController {
    constructor(private readonly projectCategoriesService: ProjectCategoriesService) { }

    @Post()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_CREATE)
    create(@Body() createDto: { name: string; description?: string; slug?: string }) {
        return this.projectCategoriesService.create(createDto);
    }

    @Get()
    findAll() {
        return this.projectCategoriesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.projectCategoriesService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_EDIT)
    update(@Param('id') id: string, @Body() updateDto: { name?: string; description?: string; slug?: string }) {
        return this.projectCategoriesService.update(id, updateDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_DELETE)
    remove(@Param('id') id: string) {
        return this.projectCategoriesService.remove(id);
    }
}
