import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PackagesModule } from '../packages/packages.module';

@Module({
    imports: [PrismaModule, PackagesModule],
    controllers: [WebhooksController],
    providers: [WebhooksService],
    exports: [WebhooksService],
})
export class WebhooksModule { }
