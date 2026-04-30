import { Module } from '@nestjs/common';
import { RedirectsService } from './redirects.service';
import { RedirectsController } from './redirects.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { PackagesModule } from '../packages/packages.module';

@Module({
    imports: [PrismaModule, AuditLogModule, PackagesModule],
    controllers: [RedirectsController],
    providers: [RedirectsService],
    exports: [RedirectsService],
})
export class RedirectsModule { }
