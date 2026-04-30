import { Controller, Post, Get, Body, Delete, Param, UseGuards, BadRequestException, Req } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IpGuard } from '../auth/ip.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { AccessControlService } from '../auth/access-control.service';
import { PackageEnforcementGuard } from '../packages/package-enforcement.guard';
import { RequireLimit, PackageLimit } from '../packages/require-limit.decorator';

@Controller('invitations')
export class InvitationsController {
    constructor(
        private readonly invitationsService: InvitationsService,
        private readonly accessControl: AccessControlService,
    ) { }

    @UseGuards(JwtAuthGuard, IpGuard, PermissionsGuard, PackageEnforcementGuard)
    @RequirePermissions(Permission.USERS_CREATE)
    @RequireLimit(PackageLimit.TEAM_SIZE)
    @Post()
    async create(@Body() data: { email: string; role: string; ips: string[] }, @Req() req: any) {
        try {
            // Enforce role hierarchy check
            await this.accessControl.validateRoleAssignment(req.user.id, data.role);

            return await this.invitationsService.createInvitation({
                email: data.email,
                roleId: data.role,
                ipWhitelist: data.ips,
            });
        } catch (error: any) {
            throw new BadRequestException(error.message || 'Failed to process invitation');
        }
    }

    @Get('verify/:token')
    async verify(@Param('token') token: string) {
        try {
            return await this.invitationsService.verifyInvitation(token);
        } catch (error: any) {
            throw new BadRequestException(error.message || 'Verification failed');
        }
    }

    @UseGuards(JwtAuthGuard, IpGuard, PermissionsGuard)
    @RequirePermissions(Permission.USERS_CREATE)
    @Post(':id/resend')
    async resend(@Param('id') id: string) {
        try {
            return await this.invitationsService.resendInvitation(id);
        } catch (error: any) {
            throw new BadRequestException(error.message || 'Failed to resend invitation');
        }
    }

    @UseGuards(JwtAuthGuard, IpGuard, PermissionsGuard)
    @RequirePermissions(Permission.USERS_VIEW)
    @Get()
    async findAll() {
        return this.invitationsService.getInvitations();
    }

    @UseGuards(JwtAuthGuard, IpGuard, PermissionsGuard)
    @RequirePermissions(Permission.USERS_DELETE)
    @Delete(':id')
    async revoke(@Param('id') id: string) {
        return this.invitationsService.revokeInvitation(id);
    }
}
