import { Module } from '@nestjs/common';
import { PluginsService } from './plugins.service';
import { PluginsController } from './plugins.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PackagesModule } from '../packages/packages.module';
import { PaymentsModule } from '../payments/payments.module';
import { ThemesModule } from '../themes/themes.module';

@Module({
    // ThemesModule added so PluginsService can inject ThemesService for the
    // active-theme compatibility gate. Without it, install() would have no
    // way to check whether the user's theme exposes the fields a plugin
    // requires (e.g. visual-editor needs sectionVariants).
    imports: [PrismaModule, PackagesModule, PaymentsModule, ThemesModule],
    controllers: [PluginsController],
    providers: [PluginsService],
    exports: [PluginsService],
})
export class PluginsModule {}
