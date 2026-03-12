import { Module } from '@nestjs/common';
import { ThemesController } from './themes.controller';
import { ThemesService } from './themes.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SetupModule } from '../setup/setup.module';

@Module({
    imports: [PrismaModule, SetupModule],
    controllers: [ThemesController],
    providers: [ThemesService],
})
export class ThemesModule { }
