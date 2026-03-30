import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';
import { ContentItemsService } from './content-items.service';
import { ContentItemsController } from './content-items.controller';

@Module({
    imports: [PrismaModule],
    controllers: [CollectionsController, ContentItemsController],
    providers: [CollectionsService, ContentItemsService],
    exports: [CollectionsService, ContentItemsService],
})
export class CollectionsModule { }
