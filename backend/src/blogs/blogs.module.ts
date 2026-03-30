import { Module } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { BlogsController, PublicBlogsController } from './blogs.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { SeoMetaModule } from '../seo-meta/seo-meta.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
    imports: [PrismaModule, UsersModule, AuditLogModule, SeoMetaModule, WebhooksModule],
    controllers: [BlogsController, PublicBlogsController],
    providers: [BlogsService],
})
export class BlogsModule { }
