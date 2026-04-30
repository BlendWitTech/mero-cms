import { Module, forwardRef } from '@nestjs/common';
import { FormsService } from './forms.service';
import { FormsController } from './forms.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { MailModule } from '../mail/mail.module';
import { PackagesModule } from '../packages/packages.module';

@Module({
    imports: [PrismaModule, WebhooksModule, forwardRef(() => MailModule), PackagesModule],
    controllers: [FormsController],
    providers: [FormsService],
    exports: [FormsService],
})
export class FormsModule { }
