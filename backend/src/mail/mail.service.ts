import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(@Inject(forwardRef(() => SettingsService)) private settingsService: SettingsService) { }

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
     * Send an HTML email. Automatically routes through Resend or SMTP
     * based on the `email_provider` setting (defaults to 'smtp').
     */
    async sendMail(to: string, subject: string, html: string) {
        try {
            const settings = await this.settingsService.findAll();
            const provider = (settings['email_provider'] as string) || process.env.EMAIL_PROVIDER || 'smtp';
            const siteTitle = settings['site_title'] || 'Blendwit CMS';
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
     * Alias of sendMail — provided so modules can call sendTemplatedMail()
     * and themes/client deployments can override with branded templates.
     */
    async sendTemplatedMail(to: string, subject: string, innerHtml: string, _preheader?: string) {
        return this.sendMail(to, subject, innerHtml);
    }
}
