import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { TeamService } from './team.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { RequireModule } from '../setup/require-module.decorator';

@RequireModule('team')
@Controller('team')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TeamController {
    constructor(private readonly teamService: TeamService) { }

    @Post()
    @RequirePermissions(Permission.CONTENT_EDIT)
    create(@Body() data: any) {
        return this.teamService.create(data);
    }

    @Get()
    @RequirePermissions(Permission.CONTENT_VIEW)
    findAll(@Query('theme') theme?: string, @Query('isActive') isActive?: string) {
        return this.teamService.findAll({ 
            theme, 
            isActive: isActive !== undefined ? isActive === 'true' : undefined 
        });
    }

    @Get(':id')
    @RequirePermissions(Permission.CONTENT_VIEW)
    findOne(@Param('id') id: string) {
        return this.teamService.findById(id);
    }

    @Patch(':id')
    @RequirePermissions(Permission.CONTENT_EDIT)
    update(@Param('id') id: string, @Body() data: any) {
        return this.teamService.update(id, data);
    }

    @Delete(':id')
    @RequirePermissions(Permission.CONTENT_EDIT)
    remove(@Param('id') id: string) {
        return this.teamService.remove(id);
    }
}
