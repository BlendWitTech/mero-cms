import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

import { MailService } from '../mail/mail.service';

@Injectable()
export class InvitationsService {
    private readonly logger = new Logger(InvitationsService.name);

    constructor(
        private prisma: PrismaService,
        private mailService: MailService
    ) { }

    async createInvitation(data: { email: string; roleId: string; ipWhitelist: string[] }) {
        const existing = await (this.prisma as any).invitation.findUnique({ where: { email: data.email } });
        if (existing && existing.status === 'PENDING') {
            throw new BadRequestException('An active invitation already exists for this email.');
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48); // 48 hours expiration

        this.logger.log(`Creating invitation for ${data.email} with role ${data.roleId}`);
        const invitation = await (this.prisma as any).invitation.create({
            data: {
                email: data.email,
                roleId: data.roleId,
                ipWhitelist: data.ipWhitelist,
                token,
                expiresAt,
                status: 'PENDING',
            },
        });

        const frontendUrl = (process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
        const inviteLink = `${frontendUrl}/register?token=${token}`;
        const html = `
            <h3>You have been invited to Blendwit CMS</h3>
            <p>Click the link below to accept your invitation and set up your account:</p>
            <a href="${inviteLink}">${inviteLink}</a>
            <p>This link expires in 48 hours.</p>
        `;

        try {
            await this.mailService.sendMail(data.email, 'Invitation to Blendwit CMS', html);
            this.logger.log(`Invitation email successfully sent to ${data.email}`);
        } catch (error: any) {
            this.logger.error(`Failed to send invitation email to ${data.email}: ${error.message}`);
            // We dont want to delete the invitation if it was created, but we want the user to know it failed
            throw new BadRequestException(`Invitation created, but email failed: ${error.message}`);
        }

        return invitation;
    }

    async getInvitations() {
        return (this.prisma as any).invitation.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async verifyInvitation(token: string) {
        const invitation = await (this.prisma as any).invitation.findUnique({
            where: { token },
        });

        if (!invitation) {
            throw new BadRequestException('Invalid invitation token.');
        }

        if (invitation.status !== 'PENDING') {
            throw new BadRequestException(`Invitation is already ${invitation.status.toLowerCase()}.`);
        }

        if (new Date() > invitation.expiresAt) {
            throw new BadRequestException('Invitation token has expired.');
        }

        return invitation;
    }

    async resendInvitation(id: string) {
        const invitation = await (this.prisma as any).invitation.findUnique({ where: { id } });
        if (!invitation || invitation.status !== 'PENDING') {
            throw new BadRequestException('Invitation not found or no longer pending.');
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48);

        const updated = await (this.prisma as any).invitation.update({
            where: { id },
            data: { token, expiresAt },
        });

        const frontendUrl = (process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
        const inviteLink = `${frontendUrl}/register?token=${token}`;
        const html = `
            <h3>Invitation Resent: Join Blendwit CMS</h3>
            <p>Your invitation to join the Blendwit team has been updated. Please click the link below to set up your account:</p>
            <a href="${inviteLink}">${inviteLink}</a>
            <p>This link expires in 48 hours.</p>
        `;

        try {
            await this.mailService.sendMail(invitation.email, 'Updated Invitation: Blendwit CMS', html);
            this.logger.log(`Invitation resent to ${invitation.email}`);
        } catch (error: any) {
            this.logger.error(`Failed to resend invitation email to ${invitation.email}: ${error.message}`);
            throw new BadRequestException(`Failed to send updated invitation: ${error.message}`);
        }
        return updated;
    }

    async revokeInvitation(id: string) {
        const invitation = await (this.prisma as any).invitation.findUnique({ where: { id } });
        if (!invitation) {
            throw new BadRequestException('Invitation not found.');
        }

        const updated = await (this.prisma as any).invitation.update({
            where: { id },
            data: { status: 'REVOKED' },
        });

        const html = `
            <h3>Invitation Revoked: Blendwit CMS</h3>
            <p>We are writing to inform you that your invitation to join the Blendwit team has been revoked.</p>
            <p>If you believe this is a mistake, please contact your administrator.</p>
        `;

        try {
            await this.mailService.sendMail(invitation.email, 'Invitation Revoked: Blendwit CMS', html);
            this.logger.log(`Revocation email sent to ${invitation.email}`);
        } catch (error: any) {
            this.logger.error(`Failed to send revocation email to ${invitation.email}: ${error.message}`);
            // We still consider the revocation successful even if the email fails
        }

        return updated;
    }
}
