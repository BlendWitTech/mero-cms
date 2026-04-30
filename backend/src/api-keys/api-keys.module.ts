import { Module } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysController } from './api-keys.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PackagesModule } from '../packages/packages.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
    imports: [PrismaModule, PackagesModule, AuditLogModule],
    controllers: [ApiKeysController],
    providers: [ApiKeysService],
    exports: [ApiKeysService],
})
export class ApiKeysModule {}
