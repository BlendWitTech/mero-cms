import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { MenusService } from './menus.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { RequireModule } from '../setup/require-module.decorator';

@RequireModule('menus')
@Controller('menus')
export class MenusController {
    constructor(private readonly menusService: MenusService) { }

    @Post()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.MENUS_MANAGE)
    create(@Body() createMenuDto: any) {
        return this.menusService.create(createMenuDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.MENUS_MANAGE)
    findAll() {
        return this.menusService.findAll();
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.MENUS_MANAGE)
    findOne(@Param('id') id: string) {
        return this.menusService.findOne(id);
    }

    @Get('slug/:slug')
    findBySlug(@Param('slug') slug: string) {
        return this.menusService.findBySlug(slug);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.MENUS_MANAGE)
    update(@Param('id') id: string, @Body() updateMenuDto: any) {
        return this.menusService.update(id, updateMenuDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.MENUS_MANAGE)
    remove(@Param('id') id: string) {
        return this.menusService.remove(id);
    }
}
