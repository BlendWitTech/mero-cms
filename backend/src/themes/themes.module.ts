import { Module } from '@nestjs/common';
import { ThemesController } from './themes.controller';
import { ThemesService } from './themes.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SetupModule } from '../setup/setup.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { PackagesModule } from '../packages/packages.module';

@Module({
    imports: [PrismaModule, SetupModule, WebhooksModule, AuditLogModule, PackagesModule],
    controllers: [ThemesController],
    providers: [ThemesService],
    exports: [ThemesService],
})
export class ThemesModule { }
