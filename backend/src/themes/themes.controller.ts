import { Controller, Post, UseInterceptors, UploadedFile, Get, BadRequestException, Param, Patch, Body, UseGuards } from '@nestjs/common';
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
        @Body('importDemoContent') importDemoContent?: boolean
    ) {
        return this.themesService.setupTheme(name, importDemoContent);
    }

    @Post(':name/activate')
    @RequirePermissions(Permission.THEMES_MANAGE)
    async activateTheme(
        @Param('name') name: string,
        @Body('clearData') clearData?: boolean,
        @Body('importDemoContent') importDemoContent?: boolean
    ) {
        return this.themesService.setActiveTheme(name, clearData, importDemoContent);
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
}
