import { Controller, Get, Post, Body, Patch, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { PagesService } from './pages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { RequireModule } from '../setup/require-module.decorator';
import { PackageEnforcementGuard } from '../packages/package-enforcement.guard';
import { RequireLimit, PackageLimit } from '../packages/require-limit.decorator';

/**
 * Package tier behaviour:
 *   Basic   — can EDIT section content on existing seeded pages (home, privacy, terms etc.)
 *             but cannot create new pages or delete pages.
 *   Premium+ — full Site Editor: create, edit, delete arbitrary pages.
 *
 * So CREATE (POST) and DELETE are gated with SITE_EDITOR; EDIT (PATCH, PUT)
 * is open to every authenticated user with CONTENT_EDIT permission.
 */
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequireModule('pages')
@Controller('pages')
export class PagesController {
    constructor(private readonly pagesService: PagesService) { }

    // ─── Create / Delete — gated behind SITE_EDITOR (Premium+) ────────────────

    @Post()
    @UseGuards(PackageEnforcementGuard)
    @RequireLimit(PackageLimit.SITE_EDITOR)
    @RequirePermissions(Permission.CONTENT_CREATE)
    create(@Body() createDto: any) {
        return this.pagesService.create(createDto);
    }

    @Delete(':id')
    @UseGuards(PackageEnforcementGuard)
    @RequireLimit(PackageLimit.SITE_EDITOR)
    @RequirePermissions(Permission.CONTENT_DELETE)
    remove(@Param('id') id: string) {
        return this.pagesService.remove(id);
    }

    // ─── Edit — open to all authenticated content editors ────────────────────
    // Basic-tier users need this to change section content on seeded pages.
    // The /by-slug/:slug endpoint is update-only (404 if the page doesn't
    // exist) so it can't be used as a back door to create pages without the
    // SITE_EDITOR capability.

    @Patch(':id')
    @RequirePermissions(Permission.CONTENT_EDIT)
    update(@Param('id') id: string, @Body() updateDto: any) {
        return this.pagesService.update(id, updateDto);
    }

    @Put('by-slug/:slug')
    @RequirePermissions(Permission.CONTENT_EDIT)
    updateBySlug(@Param('slug') slug: string, @Body() dto: any) {
        return this.pagesService.updateBySlug(slug, dto);
    }

    // ─── Upsert by slug — gated (programmatic creation by slug) ──────────────

    @Post('by-slug/:slug')
    @UseGuards(PackageEnforcementGuard)
    @RequireLimit(PackageLimit.SITE_EDITOR)
    @RequirePermissions(Permission.CONTENT_EDIT)
    upsertBySlug(@Param('slug') slug: string, @Body() dto: any) {
        return this.pagesService.upsertBySlug(slug, dto);
    }

    // ─── Read routes — open to all authenticated users regardless of plan ──────

    @Get()
    @RequirePermissions(Permission.CONTENT_VIEW)
    findAll() {
        return this.pagesService.findAll();
    }

    @Get(':id')
    @RequirePermissions(Permission.CONTENT_VIEW)
    public async findOne(@Param('id') id: string) {
        return this.pagesService.findById(id);
    }
}
