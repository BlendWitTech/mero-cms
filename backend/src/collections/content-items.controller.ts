import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ContentItemsService } from './content-items.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { PackageEnforcementGuard } from '../packages/package-enforcement.guard';
import { RequireLimit, PackageLimit } from '../packages/require-limit.decorator';

@UseGuards(JwtAuthGuard, PackageEnforcementGuard)
@RequireLimit(PackageLimit.COLLECTIONS)
@Controller('content-items')
export class ContentItemsController {
    constructor(private readonly contentItemsService: ContentItemsService) { }

    @Post()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_CREATE)
    create(@Body() dto: any) {
        return this.contentItemsService.create(dto);
    }

    @Get()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_VIEW)
    findAll(@Query('collectionId') collectionId?: string) {
        return this.contentItemsService.findAll(collectionId);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_VIEW)
    findOne(@Param('id') id: string) {
        return this.contentItemsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_EDIT)
    update(@Param('id') id: string, @Body() dto: any) {
        return this.contentItemsService.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_DELETE)
    remove(@Param('id') id: string) {
        return this.contentItemsService.remove(id);
    }
}
