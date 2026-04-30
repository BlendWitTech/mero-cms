import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(MailService.name);

    constructor(@Inject(forwardRef(() => SettingsService)) private settingsService: SettingsService) { }

    /**
     * Wraps email content in a branded HTML template.
     * Uses inline styles for maximum email client compatibility.
     */
    buildTemplate(settings: Record<string, any>, content: string, preheader?: string): string {
        const siteTitle = settings['site_title'] || 'Mero CMS';
        const primaryColor = settings['primary_color'] || '#CC1414';
        // Prefer the customer-configured site URL (Settings → Branding /
        // wizard's Site URL step). Fall through to env then localhost.
        // This appBase is what mail templates use to absolute-ize the
        // logo path embedded in the header — getting it wrong means
        // email clients can't load the logo.
        const appBase = (
            (settings['site_url'] as string) ||
            process.env.NEXT_PUBLIC_SITE_URL ||
            process.env.APP_URL ||
            process.env.FRONTEND_URL ||
            `http://localhost:${process.env.PORT || 3001}`
        ).trim().replace(/\/+$/, '');
        const rawLogoUrl = settings['logo_url'] || null;
        // Resolve relative paths (e.g. /uploads/logo.png) to absolute so email clients can load them
        const logoUrl = rawLogoUrl
            ? rawLogoUrl.startsWith('http://') || rawLogoUrl.startsWith('https://')
                ? rawLogoUrl
                : `${appBase}${rawLogoUrl}`
            : null;
        const year = new Date().getFullYear();
        const footerText = settings['footer_text'] || siteTitle;
        const copyrightText = settings['copyright_text'] || `© ${year} ${siteTitle}. All rights reserved.`;
        const contactEmail = settings['smtp_from'] || settings['smtp_user'] || '';
        const contactPhone = settings['contact_phone'] || '';
        const address = settings['address'] || '';

        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${siteTitle}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F4F4F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ''}

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F4F4F4;padding:32px 16px;">
    <tr>
      <td align="center">
        <!-- Email card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${primaryColor};border-radius:16px 16px 0 0;overflow:hidden;">
                <tr>
                  <td style="padding:32px 40px;text-align:center;">
                    ${logoUrl
                ? `<img src="${logoUrl}" alt="${siteTitle}" style="max-height:56px;max-width:200px;width:auto;display:inline-block;margin:0 auto;" />`
                : `<div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:12px 24px;">
                        <span style="color:#FFFFFF;font-size:22px;font-weight:900;letter-spacing:-0.5px;">${siteTitle}</span>
                      </div>`
            }
                  </td>
                </tr>
                <!-- Red accent bar at bottom of header -->
                <tr>
                  <td style="height:4px;background:rgba(0,0,0,0.15);"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#FFFFFF;padding:40px;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#1E1E1E;border-radius:0 0 16px 16px;padding:28px 40px;text-align:center;">
              <p style="margin:0 0 8px;color:rgba(255,255,255,0.5);font-size:11px;line-height:1.6;">${footerText}</p>
              ${contactEmail || contactPhone || address ? `
              <p style="margin:0 0 12px;color:rgba(255,255,255,0.35);font-size:10px;line-height:1.7;">
                ${contactEmail ? `<a href="mailto:${contactEmail}" style="color:rgba(255,255,255,0.5);text-decoration:none;">${contactEmail}</a>` : ''}
                ${contactEmail && contactPhone ? ' &nbsp;·&nbsp; ' : ''}
                ${contactPhone ? `<a href="tel:${contactPhone}" style="color:rgba(255,255,255,0.5);text-decoration:none;">${contactPhone}</a>` : ''}
                ${address ? `<br>${address}` : ''}
              </p>` : ''}
              <p style="margin:0;color:rgba(255,255,255,0.2);font-size:10px;">${copyrightText}</p>
            </td>
          </tr>

          <!-- Bottom spacer -->
          <tr><td style="height:24px;"></td></tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    }

    private async createTransporter() {
        const settings = await this.settingsService.findAll();
        const host = (settings['smtp_host'] || process.env.SMTP_HOST) as string;
        const port = Number(settings['smtp_port'] || process.env.SMTP_PORT || 587);
        const user = (settings['smtp_user'] || process.env.SMTP_USER) as string;
        const pass = (settings['smtp_pass'] || process.env.SMTP_PASS) as string;
        const secure = (settings['smtp_secure'] === 'true') || (process.env.SMTP_SECURE === 'true');

        this.logger.debug(`SMTP Config: host=${host}, port=${port}, user=${user}, secure=${secure}`);

        if (!host || !user || !pass) {
            this.logger.warn('SMTP settings are missing in both DB and Environment. Email sending disabled.');
            return null;
        }

        // Auto-correct secure based on port to prevent SSL/TLS mismatch:
        // Port 465 = implicit TLS (secure: true), Port 587 = STARTTLS (secure: false)
        const autoSecure = port === 465 ? true : port === 587 ? false : secure;

        return nodemailer.createTransport({
            host,
            port: port || 587,
            secure: autoSecure,
            ...(autoSecure === false && { requireTLS: true }),
            connectionTimeout: 10000,  // 10s — fail fast instead of hanging 2 minutes
            greetingTimeout: 10000,
            socketTimeout: 15000,
            auth: {
                user,
                pass,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });
    }

    /**
     * Send a raw HTML email (bypasses template wrapper).
     * Prefer sendTemplatedMail for branded outgoing emails.
     * Automatically uses Resend or SMTP based on the email_provider setting.
     */
    async sendMail(to: string, subject: string, html: string) {
        try {
            const settings = await this.settingsService.findAll();
            const provider = (settings['email_provider'] as string) || process.env.EMAIL_PROVIDER || 'smtp';
            const siteTitle = settings['site_title'] || 'Mero CMS';
            const fromEmail = settings['smtp_from'] || settings['smtp_user'] || process.env.SMTP_FROM;

            if (!fromEmail) {
                throw new Error('Sender email (From Email) is missing. Please configure it in Settings → Email Services.');
            }

            if (provider === 'resend') {
                const apiKey = (settings['resend_api_key'] as string) || process.env.RESEND_API_KEY;
                if (!apiKey) throw new Error('Resend API key is not configured. Add it in Settings → Email Services.');

                const resend = new Resend(apiKey);
                const { error } = await resend.emails.send({
                    from: `${siteTitle} <${fromEmail}>`,
                    to,
                    subject,
                    html,
                });

                if (error) throw new Error(error.message);
                this.logger.log(`Email sent via Resend to ${to}`);
                return true;
            }

            // SMTP path
            const transporter = await this.createTransporter();
            if (!transporter) {
                throw new Error('SMTP is not configured. Please check your system settings.');
            }

            const info = await transporter.sendMail({
                from: `"${siteTitle}" <${fromEmail}>`,
                to,
                subject,
                html,
            });

            this.logger.log(`Email sent via SMTP to ${to}: ${info.messageId}`);
            return true;
        } catch (error: any) {
            this.logger.error(`Failed to send email to ${to}: ${error.message}`);
            throw new Error(`Email delivery failed: ${error.message}`);
        }
    }

    /**
     * Send a branded email using the site template.
     * Pass raw inner HTML content — it gets wrapped in the full template automatically.
     */
    async sendTemplatedMail(to: string, subject: string, innerHtml: string, preheader?: string) {
        const settings = await this.settingsService.findAll();
        const branded = this.buildTemplate(settings, innerHtml, preheader);
        return this.sendMail(to, subject, branded);
    }

    /**
     * Validate provided email credentials without persisting them.
     *
     * Used by the setup wizard's "Test connection" button so customers
     * can verify SMTP / Resend credentials before saving. We don't read
     * the live settings here — we test the values the customer just
     * typed in, so they get an answer about *those* credentials and
     * don't accidentally validate stale ones.
     *
     * For SMTP we run `transporter.verify()` which opens a real
     * connection, performs the EHLO + AUTH handshake, and disconnects.
     * It does not actually deliver any mail.
     *
     * For Resend we hit `resend.emails.send` with `{ dryRun: true }` is
     * NOT supported by the SDK, so we instead validate the API key by
     * fetching the domains list — a free, idempotent call that fails
     * fast with a clear 401 on a bad key.
     */
    async testEmailConnection(opts: {
        provider?: 'smtp' | 'resend';
        smtpHost?: string;
        smtpPort?: number;
        smtpUser?: string;
        smtpPass?: string;
        smtpSecure?: boolean;
        resendApiKey?: string;
    }): Promise<{ success: boolean; error?: string }> {
        const provider = opts.provider || 'smtp';

        if (provider === 'resend') {
            if (!opts.resendApiKey) {
                return { success: false, error: 'Resend API key is required.' };
            }
            try {
                const resend = new Resend(opts.resendApiKey);
                // domains.list() is the cheapest authenticated GET on the
                // Resend SDK — confirms the key is valid without any side
                // effects. A 401/403 surfaces as an SDK error here.
                const { error } = await resend.domains.list();
                if (error) return { success: false, error: error.message };
                return { success: true };
            } catch (err: any) {
                return {
                    success: false,
                    error: err?.message?.slice(0, 200) || 'Resend verification failed.',
                };
            }
        }

        // SMTP path
        const host = opts.smtpHost?.trim();
        const user = opts.smtpUser?.trim();
        const pass = opts.smtpPass;
        const port = Number(opts.smtpPort || 587);
        if (!host || !user || !pass) {
            return { success: false, error: 'Host, username, and password are required.' };
        }

        // Same secure-port autocorrect logic as createTransporter() so
        // the test reflects what we'd actually do at send time.
        const explicitSecure = opts.smtpSecure === true;
        const autoSecure = port === 465 ? true : port === 587 ? false : explicitSecure;

        try {
            const transporter = nodemailer.createTransport({
                host,
                port: port || 587,
                secure: autoSecure,
                ...(autoSecure === false && { requireTLS: true }),
                connectionTimeout: 10000,
                greetingTimeout: 10000,
                socketTimeout: 15000,
                auth: { user, pass },
                tls: { rejectUnauthorized: false },
            });
            await transporter.verify();
            transporter.close();
            return { success: true };
        } catch (err: any) {
            return {
                success: false,
                error: err?.message?.slice(0, 200) || 'SMTP verification failed.',
            };
        }
    }
}
