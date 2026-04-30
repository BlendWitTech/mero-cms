import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PackagesModule } from '../packages/packages.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { DownloadsModule } from '../downloads/downloads.module';

@Module({
    // PrismaModule for the new Order model. PackagesModule for the
    // SaasLicenseService (used to sign license JWTs after payment).
    // MailModule + DownloadsModule wire up post-purchase delivery —
    // license email with embedded download URL.
    imports: [ConfigModule, PackagesModule, PrismaModule, MailModule, DownloadsModule],
    providers: [PaymentsService],
    controllers: [PaymentsController],
    exports: [PaymentsService],
})
export class PaymentsModule {}
