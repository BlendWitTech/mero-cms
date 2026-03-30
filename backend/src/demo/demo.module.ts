import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { DemoGuard } from './demo.guard';
import { DemoService } from './demo.service';
import { DemoController } from './demo.controller';
import { DemoTasksService } from './demo-tasks.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ThemesModule } from '../themes/themes.module';

/**
 * Self-contained demo module.
 *
 * Loaded ONLY when DEMO_MODE=true (see app.module.ts conditional import).
 *
 * To strip demo features from a production build:
 *   1. Delete the entire src/demo/ directory.
 *   2. Remove the DemoModule conditional import from app.module.ts.
 *   3. Delete frontend/src/components/demo/ and frontend/src/app/token-login/.
 */
@Module({
    imports: [
        PrismaModule,
        ThemesModule,
        ScheduleModule.forRoot(),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'secret',
            signOptions: { expiresIn: '2h' },
        }),
    ],
    controllers: [DemoController],
    providers: [DemoGuard, DemoService, DemoTasksService],
    exports: [DemoGuard],
})
export class DemoModule { }
