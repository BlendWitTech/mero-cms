import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TeamService } from './team.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { RequireModule } from '../setup/require-module.decorator';

@RequireModule('team')
@Controller('team')
export class TeamController {
    constructor(private readonly teamService: TeamService) { }

    @Post()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_CREATE)
    create(@Body() createTeamMemberDto: any) {
        return this.teamService.create(createTeamMemberDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_VIEW)
    findAll() {
        return this.teamService.findAll();
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_VIEW)
    findOne(@Param('id') id: string) {
        return this.teamService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_EDIT)
    update(@Param('id') id: string, @Body() updateTeamMemberDto: any) {
        return this.teamService.update(id, updateTeamMemberDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_DELETE)
    remove(@Param('id') id: string) {
        return this.teamService.remove(id);
    }

    @Post('reorder')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_EDIT)
    reorder(@Body() updates: Array<{ id: string; order: number }>) {
        return this.teamService.reorder(updates);
    }

    // Public route
    @Get('public/list')
    getPublic() {
        return this.teamService.findAll();
    }
}
