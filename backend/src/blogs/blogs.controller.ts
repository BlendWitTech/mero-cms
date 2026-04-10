import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, NotFoundException } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IpGuard } from '../auth/ip.guard';
import { UsersService } from '../users/users.service';
import { AuditLogService } from '../audit-log/audit-log.service';

import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { RequireModule } from '../setup/require-module.decorator';

@UseGuards(JwtAuthGuard, IpGuard, PermissionsGuard)
@RequireModule('blogs')
@Controller('blogs')
export class BlogsController {
    constructor(
        private readonly blogsService: BlogsService,
        private readonly usersService: UsersService,
        private readonly auditLog: AuditLogService
    ) { }

    @Post()
    @RequirePermissions(Permission.CONTENT_CREATE)
    async create(@Request() req, @Body() createPostDto: CreatePostDto) {
        const user = await this.usersService.findOne(req.user.email);
        if (!user) throw new Error('User not found');

        const roleName = (user as any).role.name;

        // Contributor restriction: Can only create drafts
        if (roleName === 'Contributor') {
            createPostDto.status = 'DRAFT';
        }

        const post = await this.blogsService.create(user.id, createPostDto);
        await this.auditLog.log(user.id, 'BLOG_CREATE', { title: post.title, slug: post.slug });
        return post;
    }

    @Post('bulk/delete')
    @RequirePermissions(Permission.CONTENT_DELETE)
    bulkDelete(@Body('ids') ids: string[]) {
        return this.blogsService.bulkDelete(ids);
    }

    @Post('bulk/status')
    @RequirePermissions(Permission.CONTENT_EDIT)
    bulkUpdateStatus(@Body('ids') ids: string[], @Body('status') status: string) {
        return this.blogsService.bulkUpdateStatus(ids, status);
    }

    @Get()
    @RequirePermissions(Permission.CONTENT_VIEW)
    findAll(
        @Query('status') status?: string,
        @Query('category') category?: string,
        @Query('tag') tag?: string
    ) {
        return this.blogsService.findAll(status, category, tag);
    }

    @Get(':slug')
    @RequirePermissions(Permission.CONTENT_VIEW)
    findOne(@Param('slug') slug: string) {
        return this.blogsService.findOne(slug);
    }

    @Patch(':id')
    @RequirePermissions(Permission.CONTENT_EDIT)
    async update(@Request() req, @Param('id') id: string, @Body() updatePostDto: Partial<CreatePostDto>) {
        const user = await this.usersService.findOne(req.user.email);
        const post = await this.blogsService.findById(id);

        if (!user || !post) throw new Error('Not found');

        const roleName = (user as any).role.name;

        // Restriction: Authors/Contributors can only edit their own posts
        if (['Author', 'Contributor'].includes(roleName) && post.authorId !== user.id) {
            throw new Error('You can only edit your own posts');
        }

        // Contributor restriction: Cannot publish
        if (roleName === 'Contributor' && updatePostDto.status === 'PUBLISHED') {
            throw new Error('Contributors cannot publish posts');
        }

        const updated = await this.blogsService.update(id, updatePostDto);
        await this.auditLog.log(user.id, 'BLOG_UPDATE', { id, title: updated.title });
        return updated;
    }

    @Post(':id/duplicate')
    @RequirePermissions(Permission.CONTENT_CREATE)
    async duplicate(@Request() req, @Param('id') id: string) {
        const user = await this.usersService.findOne(req.user.email);
        if (!user) throw new NotFoundException('User not found');
        const post = await this.blogsService.duplicate(id, user.id);
        await this.auditLog.log(user.id, 'BLOG_DUPLICATE', { originalId: id, newId: post.id });
        return post;
    }

    @Delete(':id')
    @RequirePermissions(Permission.CONTENT_DELETE)
    async remove(@Request() req, @Param('id') id: string) {
        const user = await this.usersService.findOne(req.user.email);
        const post = await this.blogsService.findById(id);

        if (!user || !post) throw new Error('Not found');

        const roleName = (user as any).role.name;

        if (['Author', 'Contributor'].includes(roleName) && post.authorId !== user.id) {
            throw new Error('You can only delete your own posts');
        }

        const res = await this.blogsService.remove(id);
        await this.auditLog.log(user.id, 'BLOG_DELETE', { id, title: post.title });
        return res;
    }
}

// Public Blog Controller (No Auth Required)
@RequireModule('blogs')
@Controller('posts/public')
export class PublicBlogsController {
    constructor(private readonly blogsService: BlogsService) { }

    @Get()
    async findPublished(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('category') category?: string,
        @Query('tag') tag?: string,
        @Query('featured') featured?: string
    ) {
        const pageNum = parseInt(page || '1', 10);
        const limitNum = parseInt(limit || '10', 10);
        const isFeatured = featured === 'true';

        return this.blogsService.findPublished(pageNum, limitNum, category, tag, isFeatured);
    }

    @Get(':slug')
    async findPublishedBySlug(@Param('slug') slug: string) {
        return this.blogsService.findPublishedBySlug(slug);
    }
}
