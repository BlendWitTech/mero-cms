import { Module } from '@nestjs/common';
import { PlotCategoriesService } from './plot-categories.service';
import { PlotCategoriesController } from './plot-categories.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PlotCategoriesController],
    providers: [PlotCategoriesService],
    exports: [PlotCategoriesService],
})
export class PlotCategoriesModule {}
