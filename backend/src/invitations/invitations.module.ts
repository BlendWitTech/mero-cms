import { Module } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

import { MailModule } from '../mail/mail.module';
import { PackagesModule } from '../packages/packages.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
    // SettingsModule for getSiteUrl() — invite emails embed absolute
    // links pointing to the customer's public hostname.
    imports: [PrismaModule, UsersModule, MailModule, AuthModule, PackagesModule, SettingsModule],
    providers: [InvitationsService],
    controllers: [InvitationsController],
    exports: [InvitationsService],
})
export class InvitationsModule { }
