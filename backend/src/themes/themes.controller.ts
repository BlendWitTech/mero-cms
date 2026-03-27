import { Controller, Post, UseInterceptors, UploadedFile, Get, Param, Patch, Delete, Body, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ThemesService } from './themes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { RequireModule } from '../setup/require-module.decorator';

@RequireModule('themes')
@Controller('themes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ThemesController {
    constructor(private readonly themesService: ThemesService) { }

    @Post('upload')
    @RequirePermissions(Permission.THEMES_MANAGE)
    @UseInterceptors(FileInterceptor('file'))
    async uploadTheme(@UploadedFile() file: Express.Multer.File) {
        return this.themesService.processThemeUpload(file);
    }

    @Get()
    @RequirePermissions(Permission.THEMES_MANAGE)
    async listThemes() {
        return this.themesService.listThemes();
    }

    @Get('active')
    async getActiveTheme() {
        return { activeTheme: await this.themesService.getActiveTheme() };
    }

    @Post(':name/install-modules')
    @RequirePermissions(Permission.THEMES_MANAGE)
    async installModules(@Param('name') name: string) {
        return this.themesService.prepareThemeModules(name);
    }

    @Post(':name/setup')
    @RequirePermissions(Permission.THEMES_MANAGE)
    async setupTheme(
        @Param('name') name: string,
        @Body('clearPrevious') clearPrevious?: boolean
    ) {
        return this.themesService.setupTheme(name, clearPrevious);
    }

    @Post(':name/activate')
    @RequirePermissions(Permission.THEMES_MANAGE)
    async activateTheme(
        @Param('name') name: string,
        @Body('importDemoContent') importDemoContent?: boolean
    ) {
        return this.themesService.setActiveTheme(name, importDemoContent);
    }

    @Get('details')
    @RequirePermissions(Permission.THEMES_MANAGE)
    async listThemesWithDetails() {
        return this.themesService.listThemesWithDetails();
    }

    @Get(':name/details')
    @RequirePermissions(Permission.THEMES_MANAGE)
    async getThemeDetails(@Param('name') name: string) {
        return this.themesService.getThemeDetails(name);
    }

    @Patch(':name/deployed-url')
    @RequirePermissions(Permission.THEMES_MANAGE)
    async setDeployedUrl(@Param('name') name: string, @Body('url') url: string) {
        return this.themesService.setDeployedUrl(name, url);
    }

    @Get('active/page-schema')
    async getPageSchema() {
        return this.themesService.getPageSchema();
    }

    @Post('reset')
    @RequirePermissions(Permission.THEMES_MANAGE)
    async resetToBase() {
        return this.themesService.resetToBaseState();
    }

    @Get('active/module-aliases')
    async getModuleAliases() {
        return { moduleAliases: await this.themesService.getModuleAliases() };
    }

    @Get('active/module-schemas')
    async getModuleSchemas() {
        return this.themesService.getModuleSchemas();
    }

    @Get('active/config')
    async getActiveConfig() {
        return this.themesService.getActiveThemeConfig();
    }

    @Delete(':name')
    @RequirePermissions(Permission.SETTINGS_EDIT)
    async deleteTheme(@Param('name') name: string) {
        return this.themesService.deleteTheme(name);
    }

}