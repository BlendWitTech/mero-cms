import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { UsersModule } from '../users/users.module';
import { SettingsModule } from '../settings/settings.module';
import { PackagesModule } from '../packages/packages.module';

@Module({
    imports: [UsersModule, SettingsModule, PackagesModule],
    controllers: [MediaController],
    providers: [MediaService],
    exports: [MediaService],
})
export class MediaModule { }
