import { Module } from '@nestjs/common';
import { SitemapService } from './sitemap.service';
import { SitemapController } from './sitemap.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
    // SettingsModule for getSiteUrl() — sitemap URLs need the canonical
    // public hostname, which now lives as a DB setting.
    imports: [PrismaModule, SettingsModule],
    controllers: [SitemapController],
    providers: [SitemapService],
    exports: [SitemapService],
})
export class SitemapModule { }
