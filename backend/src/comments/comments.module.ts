import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { MailModule } from '../mail/mail.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  // SettingsModule for getSiteUrl() — moderation emails reference the
  // dashboard URL relative to the configured public hostname.
  imports: [MailModule, SettingsModule],
  controllers: [CommentsController],
  providers: [CommentsService]
})
export class CommentsModule {}
