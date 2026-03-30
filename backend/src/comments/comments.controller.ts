import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { RequireModule } from '../setup/require-module.decorator';

@RequireModule('comments')
@Controller('comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) { }

    @Post()
    create(@Body() createCommentDto: any) {
        return this.commentsService.create(createCommentDto);
    }

    @Get()
    findAll(@Query('postId') postId: string) {
        return this.commentsService.findAll(postId);
    }

    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Patch(':id/status')
    @RequirePermissions(Permission.CONTENT_EDIT)
    updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.commentsService.updateStatus(id, status);
    }

    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Delete(':id')
    @RequirePermissions(Permission.CONTENT_DELETE)
    remove(@Param('id') id: string) {
        return this.commentsService.remove(id);
    }
}
