import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { SetupModule } from '../setup/setup.module';

@Module({
    imports: [PrismaModule, SettingsModule, SetupModule],
    controllers: [PublicController],
})
export class PublicModule { }
