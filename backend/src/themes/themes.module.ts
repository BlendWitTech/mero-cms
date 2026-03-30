import { Module } from '@nestjs/common';
import { ThemesController } from './themes.controller';
import { ThemesService } from './themes.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SetupModule } from '../setup/setup.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
    imports: [PrismaModule, SetupModule, WebhooksModule],
    controllers: [ThemesController],
    providers: [ThemesService],
    exports: [ThemesService],
})
export class ThemesModule { }
