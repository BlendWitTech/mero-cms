import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

import { MailService } from '../mail/mail.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class InvitationsService {
    private readonly logger = new Logger(InvitationsService.name);

    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
        // SettingsService.getSiteUrl() — invite links must point to the
        // customer's public hostname, configured in Settings → Branding.
        private settings: SettingsService,
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

        // If a previous (revoked/expired) invitation exists, reuse it with updated fields
        const invitation = existing
            ? await (this.prisma as any).invitation.update({
                where: { email: data.email },
                data: { roleId: data.roleId, ipWhitelist: data.ipWhitelist, token, expiresAt, status: 'PENDING' },
            })
            : await (this.prisma as any).invitation.create({
                data: {
                    email: data.email,
                    roleId: data.roleId,
                    ipWhitelist: data.ipWhitelist,
                    token,
                    expiresAt,
                    status: 'PENDING',
                },
            });

        const frontendUrl = await this.settings.getSiteUrl();
        const inviteLink = `${frontendUrl}/register?token=${token}`;
        const html = `
            <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#1E1E1E;line-height:1.2;">You've Been Invited!</h2>
            <p style="margin:0 0 24px;font-size:14px;color:#6B7280;line-height:1.6;">You have been invited to join the team. Click the button below to accept your invitation and set up your account.</p>

            <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
              <tr>
                <td style="background-color:#CC1414;border-radius:8px;">
                  <a href="${inviteLink}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.03em;">Accept Invitation →</a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:12px;color:#9CA3AF;line-height:1.6;">Or copy and paste this link into your browser:</p>
            <p style="margin:0 0 24px;font-size:11px;color:#6B7280;word-break:break-all;background:#F9FAFB;padding:10px 14px;border-radius:8px;border:1px solid #E5E7EB;">${inviteLink}</p>

            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #F3F4F6;padding-top:20px;margin-top:4px;">
              <tr>
                <td style="padding:14px;background:#FEF2F2;border-radius:10px;border:1px solid #FCA5A5;">
                  <p style="margin:0;font-size:12px;color:#991B1B;font-weight:600;">⏰ This invitation link expires in <strong>48 hours</strong>.</p>
                  <p style="margin:6px 0 0;font-size:11px;color:#B91C1C;">If you did not expect this invitation, please ignore this email.</p>
                </td>
              </tr>
            </table>
        `;

        try {
            await this.mailService.sendTemplatedMail(data.email, 'You\'ve Been Invited — Join the Team', html, 'Accept your team invitation before it expires in 48 hours.');
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

        const frontendUrl = await this.settings.getSiteUrl();
        const inviteLink = `${frontendUrl}/register?token=${token}`;
        const html = `
            <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#1E1E1E;line-height:1.2;">Your Invitation Has Been Refreshed</h2>
            <p style="margin:0 0 24px;font-size:14px;color:#6B7280;line-height:1.6;">Your invitation link has been updated with a new expiry. Click the button below to complete your registration.</p>

            <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
              <tr>
                <td style="background-color:#CC1414;border-radius:8px;">
                  <a href="${inviteLink}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.03em;">Complete Registration →</a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:12px;color:#9CA3AF;line-height:1.6;">Or copy and paste this link into your browser:</p>
            <p style="margin:0 0 24px;font-size:11px;color:#6B7280;word-break:break-all;background:#F9FAFB;padding:10px 14px;border-radius:8px;border:1px solid #E5E7EB;">${inviteLink}</p>

            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="padding:14px;background:#FEF2F2;border-radius:10px;border:1px solid #FCA5A5;">
                  <p style="margin:0;font-size:12px;color:#991B1B;font-weight:600;">⏰ This link expires in <strong>48 hours</strong>.</p>
                </td>
              </tr>
            </table>
        `;

        try {
            await this.mailService.sendTemplatedMail(invitation.email, 'Updated Invitation — Complete Your Registration', html, 'Your invitation has been refreshed. Complete your setup now.');
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
            <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#1E1E1E;line-height:1.2;">Invitation Revoked</h2>
            <p style="margin:0 0 24px;font-size:14px;color:#6B7280;line-height:1.6;">We are writing to inform you that your invitation to join the team has been revoked by an administrator.</p>

            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="padding:16px 20px;background:#FEF2F2;border-radius:10px;border:1px solid #FCA5A5;border-left:4px solid #CC1414;">
                  <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#991B1B;">Access Removed</p>
                  <p style="margin:0;font-size:12px;color:#B91C1C;line-height:1.6;">If you believe this is a mistake or have questions, please contact your administrator directly.</p>
                </td>
              </tr>
            </table>
        `;

        try {
            await this.mailService.sendTemplatedMail(invitation.email, 'Invitation Revoked', html, 'Your team invitation has been revoked.');
            this.logger.log(`Revocation email sent to ${invitation.email}`);
        } catch (error: any) {
            this.logger.error(`Failed to send revocation email to ${invitation.email}: ${error.message}`);
            // We still consider the revocation successful even if the email fails
        }

        return updated;
    }
}
