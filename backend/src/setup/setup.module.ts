import { Module } from '@nestjs/common';
import { SetupController } from './setup.controller';
import { SetupService } from './setup.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [PrismaModule, SettingsModule, AuthModule],
    controllers: [SetupController],
    providers: [SetupService],
    exports: [SetupService],
})
export class SetupModule { }
