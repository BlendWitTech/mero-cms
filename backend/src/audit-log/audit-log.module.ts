import { Module, Global } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PackagesModule } from '../packages/packages.module';

@Global() // Make it global so we don't have to import it everywhere
@Module({
    imports: [PrismaModule, PackagesModule],
    controllers: [AuditLogController],
    providers: [AuditLogService],
    exports: [AuditLogService],
})
export class AuditLogModule { }
