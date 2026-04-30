import { Module } from '@nestjs/common';
import { RobotsService } from './robots.service';
import { RobotsController } from './robots.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { PackagesModule } from '../packages/packages.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
    // SettingsModule for getSiteUrl() — robots.txt prints absolute
    // Sitemap: lines that reference the canonical public hostname.
    imports: [PrismaModule, AuditLogModule, PackagesModule, SettingsModule],
    controllers: [RobotsController],
    providers: [RobotsService],
    exports: [RobotsService],
})
export class RobotsModule { }
