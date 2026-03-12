import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { SetupModule } from '../setup/setup.module';
import { ThemesModule } from '../themes/themes.module';

@Module({
    imports: [PrismaModule, SettingsModule, SetupModule, ThemesModule],
    controllers: [PublicController],
})
export class PublicModule { }
