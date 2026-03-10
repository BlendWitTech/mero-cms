import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TimelineService } from './timeline.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { RequireModule } from '../setup/require-module.decorator';

@RequireModule('timeline')
@Controller('timeline')
export class TimelineController {
    constructor(private readonly timelineService: TimelineService) { }

    @Post()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_CREATE)
    create(@Body() createMilestoneDto: any) {
        return this.timelineService.create(createMilestoneDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_VIEW)
    findAll() {
        return this.timelineService.findAll();
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_VIEW)
    findOne(@Param('id') id: string) {
        return this.timelineService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_EDIT)
    update(@Param('id') id: string, @Body() updateMilestoneDto: any) {
        return this.timelineService.update(id, updateMilestoneDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_DELETE)
    remove(@Param('id') id: string) {
        return this.timelineService.remove(id);
    }

    @Post('reorder')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_EDIT)
    reorder(@Body() updates: Array<{ id: string; order: number }>) {
        return this.timelineService.reorder(updates);
    }

    // Public route
    @Get('public/list')
    getPublic() {
        return this.timelineService.findAll();
    }
}
