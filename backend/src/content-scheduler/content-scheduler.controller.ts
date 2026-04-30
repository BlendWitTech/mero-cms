import { Controller, Get, UseGuards } from '@nestjs/common';
import { ContentSchedulerService } from './content-scheduler.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';

@Controller('content-scheduler')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContentSchedulerController {
    constructor(private readonly scheduler: ContentSchedulerService) {}

    @Get()
    @RequirePermissions(Permission.CONTENT_VIEW)
    getSchedule() {
        return this.scheduler.getSchedule();
    }
}
