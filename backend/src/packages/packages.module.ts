import { Module, forwardRef } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { SaasLicenseService } from './license.service';
import { PackagesController } from './packages.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
    imports: [PrismaModule, forwardRef(() => SettingsModule)],
    controllers: [PackagesController],
    providers: [PackagesService, SaasLicenseService],
    exports: [PackagesService, SaasLicenseService],
})
export class PackagesModule {}
