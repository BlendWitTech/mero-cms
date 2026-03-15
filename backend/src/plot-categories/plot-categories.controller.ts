import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PlotCategoriesService } from './plot-categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { RequireModule } from '../setup/require-module.decorator';

@RequireModule('plot-categories')
@Controller('plot-categories')
export class PlotCategoriesController {
    constructor(private readonly plotCategoriesService: PlotCategoriesService) {}

    @Post()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_CREATE)
    create(@Body() dto: { name: string; description?: string; slug?: string }) {
        return this.plotCategoriesService.create(dto);
    }

    @Get()
    findAll() {
        return this.plotCategoriesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.plotCategoriesService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_EDIT)
    update(@Param('id') id: string, @Body() dto: { name?: string; description?: string; slug?: string }) {
        return this.plotCategoriesService.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_DELETE)
    remove(@Param('id') id: string) {
        return this.plotCategoriesService.remove(id);
    }
}
