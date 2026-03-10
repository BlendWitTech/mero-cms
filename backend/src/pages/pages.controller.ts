import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PagesService } from './pages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { RequireModule } from '../setup/require-module.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequireModule('pages')
@Controller('pages')
export class PagesController {
    constructor(private readonly pagesService: PagesService) { }

    @Post()
    @RequirePermissions(Permission.CONTENT_CREATE)
    create(@Body() createDto: any) {
        return this.pagesService.create(createDto);
    }

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

    @Patch(':id')
    @RequirePermissions(Permission.CONTENT_EDIT)
    update(@Param('id') id: string, @Body() updateDto: any) {
        return this.pagesService.update(id, updateDto);
    }

    @Delete(':id')
    @RequirePermissions(Permission.CONTENT_DELETE)
    remove(@Param('id') id: string) {
        return this.pagesService.remove(id);
    }
}
