import { Module } from '@nestjs/common';
import { DemoController } from './demo.controller';
import { DemoService } from './demo.service';
import { DemoTasksService } from './demo-tasks.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ThemesModule } from '../themes/themes.module';

@Module({
    imports: [PrismaModule, AuthModule, ThemesModule],
    controllers: [DemoController],
    providers: [DemoService, DemoTasksService],
    exports: [DemoService],
})
export class DemoModule {}
