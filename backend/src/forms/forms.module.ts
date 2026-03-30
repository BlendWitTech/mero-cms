import { Module, forwardRef } from '@nestjs/common';
import { FormsService } from './forms.service';
import { FormsController } from './forms.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { MailModule } from '../mail/mail.module';

@Module({
    imports: [PrismaModule, WebhooksModule, forwardRef(() => MailModule)],
    controllers: [FormsController],
    providers: [FormsService],
    exports: [FormsService],
})
export class FormsModule { }
