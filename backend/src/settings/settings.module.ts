import { Module, forwardRef } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { PackagesModule } from '../packages/packages.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, forwardRef(() => MailModule), WebhooksModule, forwardRef(() => PackagesModule), AuditLogModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule { }
