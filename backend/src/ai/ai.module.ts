import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { PackagesModule } from '../packages/packages.module';

@Module({
    imports: [PackagesModule],
    providers: [AiService],
    controllers: [AiController],
    exports: [AiService],
})
export class AiModule {}
