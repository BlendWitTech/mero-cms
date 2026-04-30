import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class CommentsService {
    private readonly logger = new Logger(CommentsService.name);

    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
        // SettingsService.getSiteUrl() — comment moderation emails
        // embed an absolute review link to /dashboard/comments.
        private settings: SettingsService,
    ) { }

    async create(data: any) {
        const { content, authorName, authorEmail, postId, userId, parentId, status } = data;
        const comment = await this.prisma.comment.create({
            data: {
                content,
                authorName,
                authorEmail,
                postId,
                userId,
                parentId: parentId || null,
                status: status || 'PENDING'
            },
            include: { post: { select: { title: true, slug: true } } }
        });

        // Send notification email to admin (fire-and-forget)
        this.sendNewCommentNotification(comment).catch(err =>
            this.logger.warn(`Comment notification email failed: ${err.message}`)
        );

        return comment;
    }

    private async sendNewCommentNotification(comment: any) {
        const rows = await this.prisma.setting.findMany({
            where: { key: { in: ['contact_email', 'notification_email', 'smtp_from', 'smtp_user', 'site_title'] } }
        });
        const settings: Record<string, string> = Object.fromEntries(rows.map(r => [r.key, r.value]));
        const adminEmail = settings['notification_email'] || settings['contact_email'] || settings['smtp_from'] || settings['smtp_user'];
        if (!adminEmail) {
            this.logger.warn('Comment notification skipped: no admin email configured (set Contact Email in Settings → General)');
            return;
        }

        const siteTitle = settings['site_title'] || 'Mero CMS';
        const postTitle = comment.post?.title || 'a blog post';
        const isReply = !!comment.parentId;
        const subject = isReply
            ? `New reply on "${postTitle}" — ${siteTitle}`
            : `New comment on "${postTitle}" — ${siteTitle}`;

        const reviewUrl = `${await this.settings.getSiteUrl()}/dashboard/comments`;
        const innerHtml = `
            <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#1E1E1E;">
                ${isReply ? '↩ New Reply' : '💬 New Comment'}
            </h2>
            <p style="margin:0 0 24px;color:#6B7280;font-size:14px;">
                Someone ${isReply ? 'replied to a comment' : 'left a comment'} on <strong>${postTitle}</strong>.
                It is pending your review before it goes live.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;margin-bottom:24px;">
                <tr>
                    <td style="padding:20px 24px;">
                        <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.08em;">Author</p>
                        <p style="margin:0 0 16px;font-size:15px;font-weight:700;color:#1E1E1E;">
                            ${comment.authorName}
                            <span style="font-weight:400;color:#6B7280;font-size:13px;"> — ${comment.authorEmail}</span>
                        </p>
                        <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.08em;">Comment</p>
                        <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;border-left:3px solid #CC1414;padding-left:14px;">${comment.content}</p>
                    </td>
                </tr>
            </table>

            <table cellpadding="0" cellspacing="0">
                <tr>
                    <td style="border-radius:8px;background:#CC1414;">
                        <a href="${reviewUrl}" target="_blank"
                           style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;">
                            Review in Dashboard →
                        </a>
                    </td>
                </tr>
            </table>

            <p style="margin:20px 0 0;font-size:12px;color:#9CA3AF;">
                This comment is <strong>pending approval</strong> and will not be visible on the site until you approve it.
            </p>
        `;

        await this.mailService.sendTemplatedMail(
            adminEmail,
            subject,
            innerHtml,
            `${comment.authorName} ${isReply ? 'replied' : 'commented'} on "${postTitle}" — pending review`
        );
    }

    async findAll(postId?: string) {
        if (postId) {
            // Return only top-level comments with their approved replies nested
            return this.prisma.comment.findMany({
                where: { postId, parentId: null },
                orderBy: { createdAt: 'asc' },
                include: {
                    user: { select: { name: true, role: true } },
                    replies: {
                        where: { status: 'APPROVED' },
                        orderBy: { createdAt: 'asc' },
                        include: { user: { select: { name: true, role: true } } }
                    }
                }
            });
        }
        return this.prisma.comment.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                post: { select: { title: true, slug: true } },
                parent: { select: { authorName: true } }
            }
        });
    }

    async updateStatus(id: string, status: string) {
        return this.prisma.comment.update({
            where: { id },
            data: { status }
        });
    }

    async remove(id: string) {
        return this.prisma.comment.delete({ where: { id } });
    }
}
