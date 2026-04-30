import { Module } from '@nestjs/common';
import { DownloadsService } from './downloads.service';
import { DownloadsController } from './downloads.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';

/**
 * DownloadsModule is exported so PaymentsService can inject the
 * service and mint tokens at the moment an order goes paid — that's
 * what lets the license-delivery email include a working download
 * URL right out of the gate.
 */
@Module({
    imports: [PrismaModule, SettingsModule],
    providers: [DownloadsService],
    controllers: [DownloadsController],
    exports: [DownloadsService],
})
export class DownloadsModule {}
