import { Controller, Get, Param, Delete, Query, UseGuards, Patch, Request, Body, Post, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IpGuard } from '../auth/ip.guard';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AccessControlService } from '../auth/access-control.service';

import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';

@UseGuards(JwtAuthGuard, IpGuard, RolesGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly auditLog: AuditLogService,
        private readonly accessControl: AccessControlService,
    ) { }

    @Get('stats')
    @RequirePermissions(Permission.USERS_VIEW)
    async getStats() {
        return this.usersService.getStats();
    }

    @Get()
    @RequirePermissions(Permission.USERS_VIEW)
    async findAll(
        @Query('search') search?: string,
        @Query('role') role?: string,
        @Query('status') status?: string,
        @Query('security') security?: string,
        @Query('skip') skip?: number,
        @Query('take') take?: number,
    ) {
        const { users, total: usersTotal } = await this.usersService.findAll({
            search,
            role,
            status,
            security,
            skip: skip ? Number(skip) : 0,
            take: take ? Number(take) : 10,
        });

        let userResults = users.map(u => ({ ...u, type: 'User' }));
        let total = usersTotal;

        if (!status || status === 'Pending') {
            const invitations = await this.usersService.findAllInvitations({ search, role });
            total += invitations.length;

            // If we have room in the current page, add invitations
            if (userResults.length < (take || 10)) {
                const remaining = (take || 10) - userResults.length;
                // This is a bit complex for perfect pagination across two sources,
                // but for now, we'll append invitations if on the last page of users
                userResults = [...userResults, ...invitations.slice(0, remaining).map(i => ({ ...i, status: 'Pending', type: 'Invitation' }))];
            }
        }

        return {
            users: userResults,
            total
        };
    }

    @Get('profile')
    async getProfile(@Request() req) {
        const email = req.user?.email;
        if (!email) throw new Error('Unauthorized');
        const user = await this.usersService.findOne(email);
        if (!user) throw new Error('User not found');

        // Update lastActive timestamp
        await this.usersService.updateLastActive(user.id);

        return user;
    }

    @Get('profile/logs')
    async getLogs(@Request() req) {
        const email = req.user?.email;
        if (!email) throw new Error('Unauthorized');
        const user = await this.usersService.findOne(email);
        if (!user) throw new Error('User not found');
        return this.usersService.getActivityLogs(user.id);
    }

    @Patch('profile')
    async updateProfile(@Request() req, @Body() data: any) {
        const email = req.user?.email;
        if (!email) throw new Error('Unauthorized');
        const user = await this.usersService.findOne(email);
        if (!user) throw new Error('User not found');
        const updated = await this.usersService.updateProfile(user.id, data);
        await this.auditLog.log(user.id, 'USER_UPDATE_PROFILE', { changes: Object.keys(data) });
        return updated;
    }

    @Get('logs/all')
    async getAllLogs(
        @Query('skip') skip?: number,
        @Query('take') take?: number,
    ) {
        return this.usersService.getAllActivityLogs({
            skip: skip ? Number(skip) : 0,
            take: take ? Number(take) : 20,
        });
    }

    @Delete(':id')
    @RequirePermissions(Permission.USERS_DELETE)
    async remove(@Param('id') id: string, @Request() req) {
        await this.accessControl.validateHierarchy(req.user.id, id);
        const res = await this.usersService.remove(id);
        await this.auditLog.log(req.user.id, 'USER_DELETE', { targetUserId: id });
        return res;
    }

    @Patch(':id/deactivate')
    @RequirePermissions(Permission.USERS_DEACTIVATE)
    async deactivate(@Param('id') id: string, @Request() req) {
        await this.accessControl.validateHierarchy(req.user.id, id);
        const target = await this.usersService.findById(id);
        const res = await this.usersService.deactivate(id);
        await this.auditLog.log(req.user.id, 'USER_DEACTIVATE', {
            targetUserId: id,
            targetUserName: target?.name || 'Unknown User'
        });
        return res;
    }

    @Patch(':id/reactivate')
    @RequirePermissions(Permission.USERS_REACTIVATE)
    async reactivate(@Param('id') id: string, @Body() data: { newEmail?: string }, @Request() req) {
        await this.accessControl.validateHierarchy(req.user.id, id);

        // Only Super Admin can change email during reactivation
        if (data.newEmail) {
            const actor = await this.usersService.findOne(req.user.email);
            if (actor?.role.name !== 'Super Admin') {
                throw new ForbiddenException('Only Super Admin can change email during reactivation.');
            }
        }

        const target = await this.usersService.findById(id);
        const res = await this.usersService.reactivate(id, data.newEmail);
        await this.auditLog.log(req.user.id, 'USER_REACTIVATE', {
            targetUserId: id,
            targetUserName: target?.name || 'Unknown User',
            emailChanged: !!data.newEmail
        });
        return res;
    }

    @Patch(':id/unlock')
    @RequirePermissions(Permission.USERS_REACTIVATE)
    async unlock(@Param('id') id: string, @Request() req) {
        await this.accessControl.validateHierarchy(req.user.id, id);
        const target = await this.usersService.findById(id);
        const res = await this.usersService.unlockAccount(id);
        await this.auditLog.log(req.user.id, 'USER_UNLOCK', {
            targetUserId: id,
            targetUserName: target?.name || 'Unknown User',
        });
        return res;
    }

    @Post(':id/transfer')
    @Roles('Super Admin')
    async transfer(@Param('id') id: string, @Body() data: { targetUserId: string }, @Request() req) {
        // Transfer logic usually involves moving data from 'id' to 'targetUserId'
        // This is strictly restricted to Super Admin as per request.
        const res = await this.usersService.transferData(id, data.targetUserId);
        await this.auditLog.log(req.user.id, 'USER_DATA_TRANSFER', { sourceUserId: id, targetUserId: data.targetUserId });
        return res;
    }
}
