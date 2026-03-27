import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class LeadsService {
    private readonly logger = new Logger(LeadsService.name);

    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
        private settingsService: SettingsService,
    ) { }

    async create(createLeadDto: any) {
        const lead = await this.prisma.lead.create({ data: createLeadDto });

        // Send branded admin notification email (fire-and-forget)
        this.sendLeadNotification(lead).catch(err =>
            this.logger.warn(`Lead notification email failed: ${err.message}`)
        );

        return lead;
    }

    private async sendLeadNotification(lead: any) {
        const settings = await this.settingsService.findAll();
        const adminEmail = settings['notification_email'] || settings['contact_email'] || settings['smtp_from'] || settings['smtp_user'];
        if (!adminEmail) {
            this.logger.warn('Lead notification skipped: no admin email configured (set Contact Email in Settings → General)');
            return;
        }

        const submittedAt = new Date(lead.createdAt).toLocaleString('en-NP', {
            timeZone: 'Asia/Kathmandu', day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });

        const innerHtml = `
            <h2 style="margin:0 0 4px;font-size:22px;font-weight:900;color:#1E1E1E;line-height:1.2;">New Lead Received</h2>
            <p style="margin:0 0 28px;font-size:13px;color:#6B7280;line-height:1.6;">A new enquiry was submitted${lead.originPage ? ` from <strong style="color:#374151;">${lead.originPage}</strong>` : ''}.</p>

            <!-- Lead details card -->
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;margin-bottom:24px;">
              <tr>
                <td style="background:#CC1414;padding:12px 20px;">
                  <span style="color:#FFFFFF;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Lead Details</span>
                </td>
              </tr>
              <tr>
                <td style="padding:0;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr style="border-bottom:1px solid #F3F4F6;">
                      <td style="padding:12px 20px;background:#F9FAFB;width:120px;"><span style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.06em;">Name</span></td>
                      <td style="padding:12px 20px;"><span style="font-size:14px;font-weight:700;color:#1E1E1E;">${lead.name}</span></td>
                    </tr>
                    <tr style="border-bottom:1px solid #F3F4F6;">
                      <td style="padding:12px 20px;background:#F9FAFB;"><span style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.06em;">Email</span></td>
                      <td style="padding:12px 20px;"><a href="mailto:${lead.email}" style="font-size:14px;font-weight:600;color:#CC1414;text-decoration:none;">${lead.email}</a></td>
                    </tr>
                    ${lead.phone ? `<tr style="border-bottom:1px solid #F3F4F6;">
                      <td style="padding:12px 20px;background:#F9FAFB;"><span style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.06em;">Phone</span></td>
                      <td style="padding:12px 20px;"><a href="tel:${lead.phone}" style="font-size:14px;font-weight:600;color:#1E1E1E;text-decoration:none;">${lead.phone}</a></td>
                    </tr>` : ''}
                    ${lead.message ? `<tr style="border-bottom:1px solid #F3F4F6;">
                      <td style="padding:12px 20px;background:#F9FAFB;vertical-align:top;"><span style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.06em;">Message</span></td>
                      <td style="padding:12px 20px;"><span style="font-size:13px;color:#374151;line-height:1.6;">${lead.message.replace(/\n/g, '<br>')}</span></td>
                    </tr>` : ''}
                    <tr>
                      <td style="padding:12px 20px;background:#F9FAFB;"><span style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.06em;">Received</span></td>
                      <td style="padding:12px 20px;"><span style="font-size:13px;color:#374151;">${submittedAt}</span></td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
              <tr>
                <td style="background-color:#CC1414;border-radius:8px;">
                  <a href="mailto:${lead.email}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;">Reply to ${lead.name} →</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:11px;color:#9CA3AF;">You can also manage this lead from the CMS Dashboard → Leads.</p>
        `;

        await this.mailService.sendTemplatedMail(
            adminEmail,
            `New Lead: ${lead.name} — ${lead.email}`,
            innerHtml,
            `New enquiry from ${lead.name} (${lead.email})`
        );
    }

    async findAll(status?: string) {
        const where: any = {};
        if (status) where.status = status;

        return this.prisma.lead.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.lead.findUnique({
            where: { id },
        });
    }

    async update(id: string, updateLeadDto: any) {
        return this.prisma.lead.update({
            where: { id },
            data: updateLeadDto,
        });
    }

    async remove(id: string) {
        return this.prisma.lead.delete({
            where: { id },
        });
    }

    async updateStatus(id: string, status: string) {
        return this.prisma.lead.update({
            where: { id },
            data: { status },
        });
    }

    async getStats() {
        const [total, newLeads, contacted, converted] = await Promise.all([
            this.prisma.lead.count(),
            this.prisma.lead.count({ where: { status: 'NEW' } }),
            this.prisma.lead.count({ where: { status: 'CONTACTED' } }),
            this.prisma.lead.count({ where: { status: 'CONVERTED' } }),
        ]);

        return { total, newLeads, contacted, converted };
    }
}
