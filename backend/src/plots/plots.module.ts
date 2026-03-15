import { Module } from '@nestjs/common';
import { PlotsService } from './plots.service';
import { PlotsController } from './plots.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [PrismaModule, NotificationsModule],
    controllers: [PlotsController],
    providers: [PlotsService],
    exports: [PlotsService],
})
export class PlotsModule {}
