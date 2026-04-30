import { Module } from '@nestjs/common';
import { ContentSchedulerService } from './content-scheduler.service';
import { ContentSchedulerController } from './content-scheduler.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
    imports: [PrismaModule, WebhooksModule],
    providers: [ContentSchedulerService],
    controllers: [ContentSchedulerController],
    exports: [ContentSchedulerService],
})
export class ContentSchedulerModule {}
