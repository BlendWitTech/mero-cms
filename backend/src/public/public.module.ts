import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { SetupModule } from '../setup/setup.module';
import { ThemesModule } from '../themes/themes.module';
import { PackagesModule } from '../packages/packages.module';

@Module({
    imports: [PrismaModule, SettingsModule, SetupModule, ThemesModule, PackagesModule],
    controllers: [PublicController],
})
export class PublicModule { }
