import { Controller, Post, UseInterceptors, UploadedFile, Get, Param, Patch, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ThemesService } from './themes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { RequireModule } from '../setup/require-module.decorator';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PackageEnforcementGuard } from '../packages/package-enforcement.guard';
import { RequireLimit, PackageLimit } from '../packages/require-limit.decorator';
import { PackagesService } from '../packages/packages.service';
import { getCapabilities } from '../config/packages';

@RequireModule('themes')
@Controller('themes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ThemesController {
    constructor(
        private readonly themesService: ThemesService,
        private readonly auditLog: AuditLogService,
        private readonly packagesService: PackagesService,
    ) { }

    @Post('upload')
    @UseGuards(PackageEnforcementGuard)
    @RequireLimit(PackageLimit.THEME_COUNT)
    @RequirePermissions(Permission.THEMES_MANAGE)
    @UseInterceptors(FileInterceptor('file'))
    async uploadTheme(@Request() req, @UploadedFile() file: Express.Multer.File) {
        const result = await this.themesService.processThemeUpload(file);
        await this.auditLog.log(req.user.id, 'THEME_UPLOAD', {
            theme: result.themeName,
            filename: file.originalname,
        });
        return result;
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
    async installModules(@Request() req, @Param('name') name: string) {
        const result = await this.themesService.prepareThemeModules(name);
        await this.auditLog.log(req.user.id, 'THEME_INSTALL_MODULES', {
            theme: name,
            missingModules: result.missingModules.join(', ') || 'none',
            needsRestart: result.needsRestart,
        });
        return result;
    }

    @Post(':name/setup')
    @RequirePermissions(Permission.THEMES_MANAGE)
    async setupTheme(
        @Request() req,
        @Param('name') name: string,
        @Body('clearPrevious') clearPrevious?: boolean
    ) {
        const result = await this.themesService.setupTheme(name, clearPrevious);
        await this.auditLog.log(req.user.id, 'THEME_SETUP', {
            theme: name,
            clearPrevious: !!clearPrevious,
        });
        return result;
    }

    @Post(':name/activate')
    @RequirePermissions(Permission.THEMES_MANAGE)
    async activateTheme(
        @Request() req,
        @Param('name') name: string,
        @Body('importDemoContent') importDemoContent?: boolean,
        @Body('purgePrevious') purgePrevious?: boolean,
        @Body('designKey') designKey?: string,
    ) {
        const result = await this.themesService.setActiveTheme(
            name,
            importDemoContent,
            purgePrevious,
            designKey,
        );
        await this.auditLog.log(req.user.id, 'THEME_ACTIVATE', {
            theme: name,
            importDemoContent: !!importDemoContent,
            purgePrevious: !!purgePrevious,
            designKey: designKey || 'default',
        });
        return result;
    }

    /**
     * Lists the top-level "designs" a theme ships with — complete page
     * compositions that the activation modal surfaces as a "pick a design"
     * step. Each design bundles section-variant choices across every page
     * so the whole site shifts coherently.
     */
    @Get(':name/designs')
    @RequirePermissions(Permission.THEMES_MANAGE)
    async getThemeDesigns(@Param('name') name: string) {
        return this.themesService.getThemeDesigns(name);
    }

    /**
     * Lists every section across every page of a theme that declares variants.
     * Kept for the "View Variants" gallery so advanced users can still see
     * everything the theme ships with.
     */
    @Get(':name/variants')
    @RequirePermissions(Permission.THEMES_MANAGE)
    async getThemeVariants(@Param('name') name: string) {
        return this.themesService.getThemeVariants(name);
    }

    /** Change the design on the currently-active theme (re-seeds pages). */
    @Post('active/design')
    @RequirePermissions(Permission.THEMES_MANAGE)
    async setActiveDesign(@Request() req, @Body('designKey') designKey: string) {
        const result = await this.themesService.setActiveDesign(designKey);
        await this.auditLog.log(req.user.id, 'THEME_SET_DESIGN', { designKey });
        return result;
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
    async setDeployedUrl(@Request() req, @Param('name') name: string, @Body('url') url: string) {
        const result = await this.themesService.setDeployedUrl(name, url);
        await this.auditLog.log(req.user.id, 'THEME_DEPLOYED_URL', {
            theme: name,
            url,
        });
        return result;
    }

    @Get('active/page-schema')
    async getPageSchema() {
        return this.themesService.getPageSchema();
    }

    @Get('active/section-palette')
    async getSectionPalette() {
        return this.themesService.getSectionPalette();
    }

    @Post('reset')
    @RequirePermissions(Permission.THEMES_MANAGE)
    async resetToBase(@Request() req, @Body('hardReset') hardReset?: boolean) {
        const result = await this.themesService.resetToBaseState({ hardReset });
        await this.auditLog.log(req.user.id, 'THEME_RESET', {
            hardReset: !!hardReset,
            settingsRemoved: result.cleared['settings_removed'] || 0,
        }, 'WARNING');
        return result;
    }

    /**
     * Reinstall the currently active theme — re-imports seed data and
     * re-activates with the FRESH setup type. Used by Settings →
     * Danger Zone → Reinstall current theme and the per-theme card's
     * Reinstall affordance.
     *
     * Streams progress through the shared SetupProgressService
     * (Subject), so the admin terminal at /setup/progress will surface
     * each phase in real time.
     */
    @Post('reinstall')
    @RequirePermissions(Permission.THEMES_MANAGE)
    async reinstallActive(@Request() req) {
        const result = await this.themesService.reinstallActiveTheme();
        await this.auditLog.log(req.user.id, 'THEME_REINSTALL', {
            themeName: result.themeName,
        }, 'WARNING');
        return result;
    }

    @Get('active/module-aliases')
    async getModuleAliases() {
        return { moduleAliases: await this.themesService.getModuleAliases() };
    }

    @Get('active/module-schemas')
    async getModuleSchemas() {
        return this.themesService.getModuleSchemas();
    }

    /**
     * Visual editor's widget palette. Returns the active theme's
     * widgetCatalog with each entry tagged `locked: true` if it's a
     * premium widget AND the active package doesn't include the
     * `proWidgets` capability. The editor uses `locked` to render a
     * lock icon + upgrade prompt instead of allowing the drop.
     *
     * Pro gating model: Professional+ tiers get every widget. Basic /
     * Premium tiers get the seven basic widgets (Hero, PageHero,
     * RichContent, ListSection, LogoStrip, Stats, FinalCTA) and see
     * the rest as upsell hooks.
     */
    @Get('active/widget-catalog')
    async getWidgetCatalog() {
        const { widgets, categories } = await this.themesService.getWidgetCatalog();
        const pkg = await this.packagesService.getActivePackage();
        const caps = getCapabilities(pkg?.id);
        const proUnlocked = !!caps.proWidgets;
        return {
            widgets: widgets.map((w: any) => ({
                ...w,
                locked: !!w.premium && !proUnlocked,
            })),
            categories,
            proUnlocked,
            tier: pkg?.id ?? null,
        };
    }

    @Get('active/config')
    async getActiveConfig() {
        return this.themesService.getActiveThemeConfig();
    }

    /**
     * Branding-field contract for the active theme. The admin's
     * branding settings page calls this on mount and renders only the
     * fields the active theme respects (see getBrandingFields() docs).
     */
    @Get('active/branding-fields')
    async getActiveBrandingFields() {
        return this.themesService.getBrandingFields();
    }

    @Delete(':name')
    @RequirePermissions(Permission.SETTINGS_EDIT)
    async deleteTheme(@Request() req, @Param('name') name: string) {
        const result = await this.themesService.deleteTheme(name);
        await this.auditLog.log(req.user.id, 'THEME_DELETE', {
            theme: name,
        }, 'WARNING');
        return result;
    }

}