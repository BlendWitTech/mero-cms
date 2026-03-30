import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class FormsService {
    private readonly logger = new Logger(FormsService.name);

    constructor(
        private prisma: PrismaService,
        private webhooksService: WebhooksService,
        private mailService: MailService,
    ) { }

    async create(dto: any) {
        return (this.prisma as any).form.create({ data: dto });
    }

    async findAll() {
        return (this.prisma as any).form.findMany({
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { submissions: true } } },
        });
    }

    async findOne(id: string) {
        const form = await (this.prisma as any).form.findUnique({ where: { id } });
        if (!form) throw new NotFoundException(`Form ${id} not found`);
        return form;
    }

    async update(id: string, dto: any) {
        await this.findOne(id);
        return (this.prisma as any).form.update({ where: { id }, data: dto });
    }

    async remove(id: string) {
        await this.findOne(id);
        return (this.prisma as any).form.delete({ where: { id } });
    }

    async getSubmissions(formId: string) {
        await this.findOne(formId);
        return (this.prisma as any).formSubmission.findMany({
            where: { formId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async exportSubmissionsCsv(formId: string): Promise<string> {
        const form = await (this.prisma as any).form.findUnique({ where: { id: formId } });
        if (!form) throw new NotFoundException(`Form ${formId} not found`);
        const submissions = await (this.prisma as any).formSubmission.findMany({
            where: { formId },
            orderBy: { createdAt: 'desc' },
        });

        // Build column headers from form fields + meta columns
        const fields: Array<{ name: string; label?: string }> = form.fields || [];
        const fieldHeaders = fields.map((f: any) => f.label || f.name);
        const headers = [...fieldHeaders, 'IP', 'User Agent', 'Submitted At'];

        const escape = (v: any) => {
            const s = v == null ? '' : String(v).replace(/"/g, '""');
            return /[",\n\r]/.test(s) ? `"${s}"` : s;
        };

        const rows = submissions.map((s: any) => {
            const fieldValues = fields.map((f: any) => escape((s.data as any)?.[f.name]));
            return [...fieldValues, escape(s.ip), escape(s.userAgent), escape(new Date(s.createdAt).toISOString())].join(',');
        });

        return [headers.map(escape).join(','), ...rows].join('\r\n');
    }

    async deleteSubmission(submissionId: string) {
        return (this.prisma as any).formSubmission.delete({ where: { id: submissionId } });
    }

    async submitPublic(formId: string, data: any, ip?: string, userAgent?: string) {
        const form = await (this.prisma as any).form.findUnique({ where: { id: formId } });
        if (!form) throw new NotFoundException(`Form not found`);
        const submission = await (this.prisma as any).formSubmission.create({
            data: { formId, data, ip: ip || null, userAgent: userAgent || null },
        });
        this.webhooksService.dispatch('form.submission', { formId, formName: form.name, submissionId: submission.id }).catch(() => { });
        this.sendSubmissionNotification(form, submission).catch(err =>
            this.logger.warn(`Form submission email failed: ${err.message}`)
        );
        return submission;
    }

    private async sendSubmissionNotification(form: any, submission: any) {
        const notifyEmail = form.settings?.notifyEmail;
        if (!notifyEmail) return;

        const submittedAt = new Date(submission.createdAt).toLocaleString('en-NP', {
            timeZone: 'Asia/Kathmandu', day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });

        const fields = form.fields as Array<{ name: string; label?: string }>;
        const rowsHtml = Object.entries(submission.data as Record<string, any>)
            .map(([key, value]) => {
                const field = fields?.find((f: any) => f.name === key);
                const label = field?.label || key;
                const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value ?? '');
                return `
                  <tr style="border-bottom:1px solid #F3F4F6;">
                    <td style="padding:10px 20px;background:#F9FAFB;width:130px;"><span style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.06em;">${label}</span></td>
                    <td style="padding:10px 20px;"><span style="font-size:13px;color:#374151;">${displayValue.replace(/\n/g, '<br>')}</span></td>
                  </tr>`;
            })
            .join('');

        const innerHtml = `
            <h2 style="margin:0 0 4px;font-size:22px;font-weight:900;color:#1E1E1E;">New Form Submission</h2>
            <p style="margin:0 0 28px;font-size:13px;color:#6B7280;">A new submission was received for <strong style="color:#374151;">${form.name}</strong>.</p>

            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;margin-bottom:24px;">
              <tr>
                <td style="background:#CC1414;padding:12px 20px;">
                  <span style="color:#FFFFFF;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Submission Details</span>
                </td>
              </tr>
              <tr>
                <td style="padding:0;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    ${rowsHtml}
                    <tr>
                      <td style="padding:10px 20px;background:#F9FAFB;"><span style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.06em;">Received</span></td>
                      <td style="padding:10px 20px;"><span style="font-size:13px;color:#374151;">${submittedAt}</span></td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:11px;color:#9CA3AF;">Manage this submission from the CMS Dashboard → Forms.</p>
        `;

        await this.mailService.sendTemplatedMail(
            notifyEmail,
            `New Submission: ${form.name}`,
            innerHtml,
            `New submission received for ${form.name}`,
        );
    }
}
