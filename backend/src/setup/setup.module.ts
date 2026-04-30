import { Global, Module } from '@nestjs/common';
import { SetupController } from './setup.controller';
import { SetupService } from './setup.service';
import { SetupProgressService } from './setup-progress.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { MediaModule } from '../media/media.module';

/**
 * @Global so SetupProgressService can be injected from any feature
 * module (themes, plugins, future imports/exports) without creating
 * importer-side modules-graph cycles. SetupProgressService is a
 * singleton event bus — exactly the kind of thing that benefits from
 * being globally available. SetupService is exported alongside it for
 * symmetry, even though only the wizard uses it today.
 */
@Global()
@Module({
    // Mail + Media are imported so the wizard can call their `test*`
    // helpers from the new email / storage steps. They depend only on
    // SettingsModule + their own SDKs, so no cycles introduced here.
    imports: [PrismaModule, SettingsModule, AuthModule, MailModule, MediaModule],
    controllers: [SetupController],
    providers: [SetupService, SetupProgressService],
    exports: [SetupService, SetupProgressService],
})
export class SetupModule { }
